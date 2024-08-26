import express from "express";
import Razorpay from "razorpay"; // RazorPay's module for setting up payments.
import cors from "cors"; // Used to take requests from different ports.
import bodyParser from "body-parser"; // To parse JSON data.
import crypto from "crypto"; // To generate random strings.

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json()); // To parse JSON data.
app.use(bodyParser.urlencoded({ extended: true })); // To parse URL-encoded data.
app.use(cors()); // To allow requests from different ports.

app.post("/order", async (req, res) => {
  try {
    var razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID, // Your RazorPay key ID.
      key_secret: process.env.RAZORPAY_SECRET, // Your RazorPay secret key.
    });

    console.log(req.body);

    const amount = req.body.amount * 100; // Amount is in paise

    const options = {
      amount: amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise (500INR)
      currency: "INR", // Currency you want to accept payments in
      receipt: `test#${Date.now()}`, // A unique receipt number
    };
    const order = await razorpay.orders.create(options); // Creates a new order

    if (!order) {
      return res.status(500).send("Error"); // If order creation fails
    }

    console.log(order);

    res.json(order); // Returns the order details
  } catch (err) {
    console.log(err);

    res.status(500).send("Error");
  }
});

app.post("/payment-success-status", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body; 

  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET); 
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id); // Concatenating order_id and payment_id
  const generatedSignature = hmac.digest("hex"); // Hashing the string using SHA256 algorithm and converting it to hexadecimal format

  if (generatedSignature === razorpay_signature) { // Comparing the generated signature with the signature sent by RazorPay
    // Payment is verified
    res.send({ success: true, message: "Payment verified successfully!" }); // Sending a success response
  } else {
    // Payment verification failed
    res.status(400).send({ success: false, message: "Payment verification failed." }); // Sending a failure response
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
