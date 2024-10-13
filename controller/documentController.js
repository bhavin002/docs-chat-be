const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Joi = require('joi');
const Document = require('../models/documentModel');


const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

const uploadPreSignedUrlValidation = Joi.object({
    file: Joi.string().required()
});

// Generate a pre-signed URL for the single file

exports.uploadPreSignedUrl = async (req, res) => {

    const { error } = uploadPreSignedUrlValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { file } = req.body; // Expecting a single file

    try {
        const key = `${req.user.userId}/${file}`;
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        });
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });

        res.status(200).json({
            status: "success",
            message: "Pre-signed URL generated successfully",
            preSignedUrl: {
                key,
                URL: url
            },
        });
    } catch (error) {
        console.error('Error generating pre-signed URL:', error); // Log the error for debugging
        res.status(500).json({ message: 'Server error' });
    }
};


// create document in database

exports.createDocument = async (req, res) => {
    const { document_name, size, s3_key } = req.body;
    const userId = req.user.userId;

    try {
        const document = new Document({
            document_name,
            size,
            s3_key,
            userId
        });

        await document.save();
        res.status(201).json({ message: 'Document created successfully', document: document });
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// Get Presigned URL for File Download and preview

exports.getPresignedUrl = async (req, res) => {
    const documentId = req.params.documentId;
    try {
        const document = await Document.findById(documentId);
        const client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
            },
        });

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: document.s3_key,
        });

        const url = await getSignedUrl(client, command, { expiresIn: 604800 });
        res.status(200).json({ url });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

// get all documents

exports.getAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ userId: req.user.userId });
        res.status(200).json({ documents });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}
