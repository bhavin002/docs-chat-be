exports.chatWithDocument = `Answer the following question based only on the provided context:

<context>
{context}
</context>

Question: {question}

Strictly generate object with two keys: "answer" and "questions".
answer should be a string with the answer to the question.
questions should be an array of strings with 5 follow-up questions related to the question and provided context.
Don't add any backticks, unnecessary symbols or text.`