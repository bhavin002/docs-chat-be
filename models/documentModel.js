const { Schema, model } = require('mongoose');

const documentSchema = new Schema({
    document_name: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    s3_key: {
        type: String,
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = model('Document', documentSchema);
