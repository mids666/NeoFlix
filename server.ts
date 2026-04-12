import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // NeoPay Secure Payment API
  app.post("/api/pay", async (req, res) => {
    try {
      const { cardNumber, expiry, cvc, amount, userId, name } = req.body;

      console.log(`[NeoPay] Processing request:`, { 
        amount, 
        userId, 
        name,
        cardLast4: cardNumber?.slice(-4) 
      });

      // Basic validation
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid card number. Please enter a 16-digit card number." 
        });
      }

      if (!expiry || !expiry.includes('/')) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid expiry date. Use MM/YY format." 
        });
      }

      if (!cvc || cvc.length < 3) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid CVC." 
        });
      }

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const transactionId = `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      console.log(`[NeoPay] Payment successful: ${transactionId}`);

      res.json({ 
        success: true, 
        transactionId,
        message: "Payment processed successfully"
      });
    } catch (error) {
      console.error(`[NeoPay] Payment Error:`, error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error during payment processing" 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NeoFlix Server running on http://localhost:${PORT}`);
  });
}

startServer();
