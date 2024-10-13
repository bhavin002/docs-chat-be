exports.chatWithDocument = `Answer the following question based only on the provided context:

<context>
{context}
</context>

Question: {question}

The answer should be a well-structured, detailed response to the question. If the answer is short, add additional relevant information or context based on the question to make the response more comprehensive and readable. Avoid using any backticks, unnecessary symbols, or extraneous text.`