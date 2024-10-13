const { Schema, model } = require('mongoose');

const chatSchema = new Schema({
    query: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    documentId: {
        type: Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    }
}, {
    timestamps: true
});

module.exports = model('Chat', chatSchema);
