"use client";

import { useState, useEffect } from "react";
import axios from "axios";

function Home() {
  const [paymentStatus, setPaymentStatus] = useState(null); // State to track payment status

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js"; // Razorpay checkout script URL
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function handlePayment(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const data = {
      amount: formData.get("amount"),
    };

    try {
      alert(process.env.NEXT_PUBLIC_PORT);
      const response = await axios.post(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/order`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Public key for client-side
        amount: response.data.amount, // Amount in paise
        currency: response.data.currency, // Currency
        order_id: response.data.id, // Order ID from response
        handler: async function (response) {
          // Notify server of payment success
          try {
            const verificationResponse = await axios.post(
              `http://localhost:${process.env.NEXT_PUBLIC_PORT}/payment-success-status`,
              response
            );

            if (verificationResponse.data.success) {
              setPaymentStatus("Payment successful!");
            } else {
              setPaymentStatus("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            setPaymentStatus("Payment verification failed. Please try again.");
          }
        },
      };

      const rzp1 = new window.Razorpay(options);

      rzp1.on("payment.failed", function (response) {
        // Payment failed
        setPaymentStatus("Payment failed. Please try again.");
        console.error(response);
      });

      rzp1.open();
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      setPaymentStatus("Failed to create payment order. Please try again.");
    }
  }

  return (
    <div className="flex justify-center items-center h-screen flex-col">
      <h1>Payment Page</h1>
      <h6 className="text-red-500">This is for testing purposes only. Update the data in the .env file to ensure it works.</h6>
      <form className="flex flex-col gap-3 w-5/6 lg:w-1/6" onSubmit={handlePayment}>
        <input
          className="border-2 border-sky-300 rounded-lg text-black"
          name="amount"
          type="number"
          placeholder="Enter Amount"
        />
        <input
          id="rzp-button1"
          className="border-2 border-sky-300 rounded-lg text-black hover:cursor-pointer hover:bg-sky-200"
          type="submit"
          value="Pay"
        />
      </form>
      {paymentStatus && (
        <div className="mt-4 text-lg text-red-500">
          {paymentStatus}
        </div>
      )}
    </div>
  );
}

export default Home;
