# 🤖 NOVA MD WhatsApp Bot

A WhatsApp automation bot built with
Node.js and Baileys.

## Features

- Pairing code
- QR login
- Session support
- Command handler
- AI chatbot
- Image sticker
- Video sticker
- YouTube downloader
- Instagram downloader
- TikTok downloader
- Text to speech
- Group management
- Anti-link
- Welcome messages
- Goodbye messages
- Auto status viewer

## Installation

Install Node.js 20+

Clone repository:

git clone YOUR_REPOSITORY_URL

cd NOVA-MD

Install dependencies:

npm install

Create environment file:

cp .env.example .env

Edit .env and configure your settings.

Start bot:

npm start

## Commands

.ping
.menu
.ai question
.sticker
.download URL
.tts text
.kick @user
.add number
.promote @user
.demote @user

## AI Setup

Get a Groq API key.

https://console.groq.com/

Add it to .env:

GROQ_API_KEY=YOUR_API_KEY

## Pairing

Set your phone number:

PAIRING_NUMBER=9477XXXXXXXX

Run:

npm start

Enter the pairing code in WhatsApp.

## Session

Export session:

npm run export:session

Keep SESSION_ID private.

## Deployment

Supported deployment:

- Render
- Heroku

GitHub Actions is used for validation.

## Security

Never publish:

- .env
- SESSION_ID
- WhatsApp credentials
- API keys

## License

MIT
