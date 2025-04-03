import { useState } from "react";
import { FaStar } from "react-icons/fa";

export default function Rating({ chatId, userId }) {
  const [rating, setRating] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleRating = async (rate) => {
    setRating(rate);
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rate-response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: chatId, rating: rate, user_id: userId }),
    });

    const data = await res.json();
    if (data.success) {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex items-center">
      {submitted ? (
        <p className="text-green-500 text-sm">Thank you for your feedback!</p>
      ) : (
        [1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`cursor-pointer ${star <= rating ? "text-yellow-500" : "text-gray-400"}`}
            onClick={() => handleRating(star)}
          />
        ))
      )}
    </div>
  );
}
