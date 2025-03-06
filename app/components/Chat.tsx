import React, { useState } from 'react';

export const Chat = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState<string>('');

    const sendMessage = async () => {
        if (!input) return;

        // Add user message to the chat
        setMessages((prev) => [...prev, `You: ${input}`]);

        // Send request to the backend chat API
        const response = await fetch('YOUR_CHAT_API_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: input }),
        });

        const data = await response.json();
        // Assuming the response contains a 'reply' field
        setMessages((prev) => [...prev, `Bot: ${data.reply}`]);
        setInput('');
    };

    return (
        <div className="chat-container">
            <div className="chat-box">
                {messages.map((msg, index) => (
                    <div key={index} className="chat-message">{msg}</div>
                ))}
            </div>
            <div style={{ display: 'flex', width: '100%' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}; 