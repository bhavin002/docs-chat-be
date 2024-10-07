const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Joi = require('joi');

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

const getPresignedUrl = Joi.object({
    key: Joi.string().required()
});


exports.uploadPreSignedUrl = async (req, res) => {

    const { error } = uploadPreSignedUrlValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { file } = req.body; // Expecting a single file

    try {
        // Generate a pre-signed URL for the single file
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


// Get Presigned URL for File Download and preview

exports.getPresignedUrl = async (req, res) => {
    const { error } = getPresignedUrl.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const { key } = req.body;

    try {
        const client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
            },
        });

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        });

        const url = await getSignedUrl(client, command, { expiresIn: 604800 });
        res.status(200).json({ url });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}