const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const { encode } = require('gpt-tokenizer');
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { chatWithDocument } = require('../util/prompt');
const Chat = require('../models/chatModel');
const Joi = require('joi');

const upsertDataValidation = Joi.object({
    key: Joi.string().required(),
    documentId: Joi.string().required()
});

const chatWithDocumentValidation = Joi.object({
    documentId: Joi.string().required(),
    query: Joi.string().required()
});

const openai = new OpenAI();
const llm = new ChatOpenAI({
    model: "gpt-4",
    temperature: 0.1,
})

// Setup Pinecone
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});


const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

async function splitTextIntoChunks(text, chunkSize = 4000, overlap = 200) {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap: overlap });
    const chunks = await splitter.splitText(text);

    // Ensure each chunk is within token limits
    const maxTokensPerChunk = 8191; // Safe limit for text-embedding-ada-002
    const validChunks = [];

    for (let chunk of chunks) {
        let tokenCount = encode(chunk).length;

        while (tokenCount > maxTokensPerChunk) {
            const smallerChunk = chunk.substring(0, Math.floor(chunk.length * (maxTokensPerChunk / tokenCount)));
            validChunks.push(smallerChunk);
            chunk = chunk.substring(smallerChunk.length);
            tokenCount = encode(chunk).length;
        }

        validChunks.push(chunk);
    }

    return validChunks;
}

// Helper function: Create embeddings with rate limiting
async function createEmbeddings(chunks) {
    console.log('✌️chunks --->', chunks.length);
    const embeddings = [];
    const batchSize = 50; // Process 50 chunks at a time
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < chunks.length; i += batchSize) {
        console.log('✌️i --->', i);
        const batch = chunks.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(batch.map(async (chunk) => {
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: chunk,
            });
            return embeddingResponse.data[0].embedding;
        }));

        embeddings.push(...batchEmbeddings);

        if (i + batchSize < chunks.length) {
            await delay(1000); // Wait for 1 second between batches to avoid rate limits
        }
    }

    return embeddings;
}

// Helper function: Break array into chunks
function chunkArray(array, chunkSize = 100) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// Store embeddings in Pinecone using batch upserts
async function storeEmbeddingsInPinecone(chunks, embeddings, documentId) {
    const vectors = chunks.map((chunk, index) => ({
        id: `chunk-${index}`,
        values: embeddings[index],
        metadata: { text: chunk, documentId: documentId },
    }));

    const batches = chunkArray(vectors, 100);

    for (const batch of batches) {
        console.log('✌️batch --->', batch);
        await pineconeIndex.upsert(batch);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between batches
    }
}


async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

async function getFileFromS3(key) {
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
    });

    const response = await client.send(command);
    return await streamToBuffer(response.Body);
}

exports.upsertData = async (req, res) => {
    try {

        const { error } = upsertDataValidation.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { key, documentId } = req.body;

        console.log('Retrieving PDF from S3...', key);
        const dataBuffer = await getFileFromS3(key);

        if (!dataBuffer || dataBuffer.length === 0) {
            return res.status(400).send('Retrieved file is empty or invalid.');
        }
        const pdfData = await pdfParse(dataBuffer);
        console.log('✌️pdfData --->', pdfData.text);

        // Split PDF content into chunks
        const chunks = await splitTextIntoChunks(pdfData.text);

        // Create embeddings for each chunk
        const embeddings = await createEmbeddings(chunks);
        console.log('✌️embeddings --->', embeddings.length);

        // Store embeddings in Pinecone using batch upserts
        await storeEmbeddingsInPinecone(chunks, embeddings, documentId);

        res.json({ message: 'PDF processed and stored successfully!' });
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }
}

exports.chatWithDocument = async (req, res) => {

    const { error } = chatWithDocumentValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { query, documentId } = req.body;
    console.log('✌️query --->', query);
    console.log('✌️documentId --->', documentId);

    try {
        // Generate embedding for the user query
        const queryEmbeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: query,
        });
        const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
        console.log('✌️queryEmbedding --->', queryEmbedding);

        // Query Pinecone for the closest match
        const queryResults = await pineconeIndex.query({
            vector: queryEmbedding,
            topK: 5, // Adjust the number of results you want
            includeValues: true,
            includeMetadata: true,
            filter: { documentId: documentId }
        });

        console.log('✌️queryResults --->', queryResults);

        // Extract and return the most relevant chunks
        const results = queryResults.matches.map(match => match.metadata.text);
        console.log('✌️results --->', results);

        const prompt = PromptTemplate.fromTemplate(chatWithDocument);

        const chain = prompt.pipe(llm);
        const response = await chain.invoke({ context: results.join('\n'), question: query });
        console.log('✌️response --->', response);

        const chat = new Chat({
            query,
            answer: response.content,
            documentId
        })

        await chat.save();

        res.json({ chat });
    } catch (error) {
        console.error('Error querying Pinecone:', error);
        res.status(500).json({ error: 'Failed to query the document' });
    }
}

exports.getChatHistory = async (req, res) => {
    try {
        const chats = await Chat.find({ documentId: req.params.documentId }).sort({ createdAt: 1 });
        console.log('✌️chats --->', chats);
        res.json({ chats });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
}
