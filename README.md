 VoiceCart AI

Shopping should feel like a conversation, not a search.

Built for Build with Gemini Hackathon — powered by Google Gemini API

---

 The Problem

Online shopping has become convenient, but it is not equally accessible to everyone.

Many users still struggle with:
- Typing product names and detailed search queries.
- Navigating complicated e-commerce interfaces.
- Comparing products, prices, and specifications.
- Finding the right product when they are unsure what to search for.
- Using conventional shopping platforms when they are more comfortable speaking in their native language.

For Tamil-speaking users, the experience can be even less natural when shopping platforms primarily expect typed English queries.

Shopping should not require users to learn how to search. They should simply be able to say what they need.**

---

 The Solution

VoiceCart AI is a Tamil-first, voice-enabled conversational shopping assistant that makes product discovery simple through natural conversation.

Instead of navigating multiple pages and filters, users can speak or type what they need in Tamil, Tanglish, or English.

VoiceCart understands the request, discovers relevant products from its catalogue, presents suitable options, and guides users through product selection and a demo checkout experience.

> Gemini is not just a chatbot in VoiceCart. It powers the conversational shopping experience and helps users move from a natural-language request to product discovery.

---

 ✨ What VoiceCart AI Offers

🎙️ Tamil-First Voice Shopping

- Speak naturally instead of typing long search queries.
- Tamil speech recognition using the browser's speech-recognition capability.
- Supports Tamil, Tanglish, and English conversations.
- Converts spoken requests into conversational shopping interactions.

 🤖 Gemini-Powered Shopping Agent

- Understands natural-language shopping requests.
- Handles product preferences and budget constraints.
- Asks relevant follow-up questions to understand user needs.
- Uses Gemini function calling to trigger product catalogue searches.
- Responds using the results returned by the product search function.

 🛍️ Intelligent Product Discovery

- Searches the available product catalogue.
- Supports category-based and maximum-price filtering.
- Recommends matching products with their names and prices.
- Helps users compare suitable options before selecting a product.

 🛒 Interactive Shopping Cart

- Add selected products to the cart.
- View selected items and prices.
- Manage the shopping selection through the frontend interface.

💳 Guided Demo Checkout

- Provides a guided checkout experience.
- Demonstrates the order-confirmation flow.
- Helps showcase how a conversational shopping journey can work from discovery to checkout.

Note: Checkout and order confirmation are demonstration features. VoiceCart does not currently process real payments, create fulfilment orders, or arrange deliveries.

---

 🔥 What Makes VoiceCart Different?

1. Conversation-First Shopping

Traditional shopping starts with a search box. VoiceCart starts with a conversation.

A user can say what they need in their own language and receive relevant product suggestions.

### 2. Tamil and Tanglish Accessibility

VoiceCart focuses on making digital shopping more approachable for Tamil-speaking users through natural-language interaction and voice input.

### 3. Gemini Function Calling

The Gemini-powered agent can call the product-search function instead of inventing catalogue results.

The backend executes the search and provides the matching product data to the agent for its response.

### 4. From Discovery to Cart

VoiceCart is designed to demonstrate more than question answering. Users can discover products, select items, add them to a cart, and explore a guided checkout flow.

### 5. A Foundation for Conversational Commerce

The prototype demonstrates how AI agents and regional-language voice interfaces can make online shopping more intuitive and accessible.

---

## 🧪 Example Shopping Experience

**User:** "Enakku 1000 rupees kulla oru pressure cooker venum."

**VoiceCart:** Understands the Tamil/Tanglish request and searches the catalogue for pressure cookers under ₹1,000.

**VoiceCart:** Presents matching options, including:
- Pigeon Favourite Aluminium Cooker 3L — ₹749
- Prestige Popular Aluminium Pressure Cooker 3L — ₹899

**User:** Selects a product.

**VoiceCart:** Continues the shopping conversation and guides the user through the next step.

The user can also explore other products, add items to the cart, and try the demo checkout experience.

---

 🧠 How Gemini Powers VoiceCart

Gemini is the conversational intelligence layer of VoiceCart.

The interaction flow:

1. The user speaks or types a shopping request.
2. The frontend sends the message to the FastAPI backend.
3. The backend passes the conversation to the Gemini-powered agent.
4. Gemini interprets the request and can invoke the `search_products` function.
5. The backend searches the product catalogue using the requested category and price constraint.
6. The matching product data is returned to Gemini.
7. Gemini generates a contextual response for the user.
8. The frontend displays the response and available shopping actions.

**The important distinction:** Gemini handles natural-language understanding and conversational decisions; the backend performs the actual catalogue search.

---

## 🏗️ Technical Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| AI Model | Google Gemini API |
| AI Integration | Google Gen AI SDK |
| Agent Capability | Gemini function calling |
| Voice Input | Browser Speech Recognition API |
| Product Catalogue | Python-based demo catalogue |
| API Communication | HTTP / REST |
| Frontend Deployment | Vercel (planned) |
| Backend Deployment | Render (planned) |

---

## 🗂️ Product Catalogue

VoiceCart currently demonstrates product discovery using a curated catalogue of six products.

| Product | Price |
|---|---:|
| Prestige Popular Aluminium Pressure Cooker 3L | ₹899 |
| Pigeon Favourite Aluminium Cooker 3L | ₹749 |
| Prestige Deluxe Pressure Cooker 5L | ₹1,199 |
| Butterfly Mixer Grinder 750W | ₹2,499 |
| Havells Table Fan 400mm | ₹1,899 |
| Pigeon Electric Rice Cooker 1.8L | ₹1,499 |

The catalogue is used to demonstrate product discovery and filtering. Product availability and prices are demo data, not live retailer inventory.

---

## 🔐 Responsible AI and Safety

VoiceCart is designed with clear boundaries:

- Product recommendations are based on the available catalogue.
- The agent is instructed not to invent product prices, stock, or delivery information.
- Users should not share OTPs, UPI PINs, or card PINs.
- Demo checkout must not be mistaken for a real payment transaction.
- Real inventory, payments, and order fulfilment are outside the current prototype scope.

---

## 🚀 Quick Start

### Prerequisites

- Node.js
- Python
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/saravanabalajisciet-crypto/Voice-Cart.git
cd Voice-Cart
```

### 2. Start the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Start FastAPI:

```bash
python -m uvicorn main:app --reload
```

Backend API: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside `frontend`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Start Next.js:

```bash
npm run dev
```

Open `http://localhost:3000`.

### 4. Get a Gemini API Key

Get your API key from:

https://aistudio.google.com/apikey

Never commit API keys or environment files to GitHub.

---

## 📁 Project Structure

```text
Voice-Cart/
│
├── backend/
│   ├── main.py          # FastAPI application and API routes
│   ├── agent.py         # Gemini-powered conversational agent
│   ├── products.py      # Product catalogue and search function
│   ├── requirements.txt
│   └── .env             # Local environment variables (not committed)
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       └── page.tsx # Main shopping interface
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## 🎯 Hackathon Demonstration

The recommended live demonstration flow:

1. Open VoiceCart AI.
2. Use Tamil or Tanglish voice input.
3. Ask for a product within a specific budget.
4. Show Gemini understanding the request.
5. Demonstrate the product-search function returning catalogue results.
6. Compare the suggested products.
7. Select a product and add it to the cart.
8. Explore the guided demo checkout and order-confirmation flow.

This demonstrates the complete conversational shopping journey rather than only a text-based AI response.

---

## 🏆 Hackathon Judging Context

VoiceCart AI is built for the **Build with Gemini Hackathon**.

The project demonstrates the use of Google Gemini API in a practical, user-facing application.

### Key areas demonstrated

- **Use of Gemini API:** Gemini powers the conversational shopping agent.
- **Function Calling:** The agent invokes a backend product-search function to retrieve relevant catalogue data.
- **Real-world Use Case:** Conversational commerce focused on Tamil-speaking users.
- **Multimodal Interaction:** Voice input through browser speech recognition, combined with Gemini-powered language understanding.
- **End-to-End Experience:** Product discovery, selection, cart interaction, and guided demo checkout.
- **Practical Implementation:** A Next.js frontend connected to a Python FastAPI backend.

**Judging agent:** Markwise AI Agent is used by the hackathon for project evaluation. VoiceCart's application logic is powered by Google Gemini; Markwise is not represented as an integrated application dependency.

---

## 🛣️ Future Scope

- Real-time retailer product and inventory integrations.
- Live price comparison across stores.
- Secure payment gateway integration.
- Real order management and delivery tracking.
- More regional Indian languages.
- Improved voice interaction and speech output.
- Personalized shopping preferences.
- Multi-store conversational commerce.

---

 🚀 Live Demo

Coming soon — deployment in progress.

The live frontend and backend URLs will be added here after deployment.

 💻 Source Code

GitHub Repository:

https://github.com/saravanabalajisciet-crypto/Voice-Cart


 ❤️ Built With

- Google Gemini API
- Next.js
- FastAPI
- Python
- TypeScript

**VoiceCart AI — Your needs. Your language. Your conversation. Your cart.**
