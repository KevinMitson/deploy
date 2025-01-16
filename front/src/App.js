import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

Chart.register(...registerables);

const App = () => {
  const [feedback, setFeedback] = useState([]);
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/feedback");
      console.log('Feedback data:', response.data);
      setFeedback(response.data);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  const filterFeedbackByDateRange = (startDate, endDate) => {
    return feedback.filter((item) => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const getDailyFeedback = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    return filterFeedbackByDateRange(startOfDay, endOfDay);
  };

  const getWeeklyFeedback = () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return filterFeedbackByDateRange(startOfWeek, endOfWeek);
  };

  const getMonthlyFeedback = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return filterFeedbackByDateRange(startOfMonth, endOfMonth);
  };

  const getYearlyFeedback = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    return filterFeedbackByDateRange(startOfYear, endOfYear);
  };

  const filteredFeedback = () => {
    switch (dateRange) {
      case "daily":
        return getDailyFeedback();
      case "weekly":
        return getWeeklyFeedback();
      case "monthly":
        return getMonthlyFeedback();
      case "yearly":
        return getYearlyFeedback();
      default:
        return feedback;
    }
  };

  const getRatingCounts = (data) => {
    const counts = {
      "Very Bad": 0,
      Bad: 0,
      Average: 0,
      Good: 0,
      "Very Good": 0,
    };
    data.forEach((item) => {
      counts[item.rating]++;
    });
    return counts;
  };

  const getLocationCounts = (data) => {
    const counts = {
      "Check-in": 0,
      Arrivals: 0,
      Departure: 0,
    };
    data.forEach((item) => {
      counts[item.location]++;
    });
    return counts;
  };

  const ratingData = {
    labels: Object.keys(getRatingCounts(filteredFeedback())),
    datasets: [
      {
        label: "Feedback Ratings",
        data: Object.values(getRatingCounts(filteredFeedback())),
        backgroundColor: [
          "#FF6384", // Very Bad
          "#36A2EB", // Bad
          "#FFCE56", // Average
          "#4BC0C0", // Good
          "#9966FF", // Very Good
        ],
      },
    ],
  };

  const locationData = {
    labels: Object.keys(getLocationCounts(filteredFeedback())),
    datasets: [
      {
        label: "Feedback by Location",
        data: Object.values(getLocationCounts(filteredFeedback())),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Feedback Report", 10, 10);
    doc.autoTable({
      head: [["Location", "Rating", "Reasons", "Date"]],
      body: filteredFeedback().map((item) => [
        item.location,
        item.rating,
        item.reasons,
        new Date(item.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
      ]),
    });
    doc.save("feedback_report.pdf");
  };

  const exportToExcel = () => {
    const worksheet = utils.json_to_sheet(
      filteredFeedback().map((item) => ({
        Location: item.location,
        Rating: item.rating,
        Reasons: item.reasons,
        Date: new Date(item.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
      }))
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Feedback");
    writeFile(workbook, "feedback_report.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Airport Feedback Dashboard</h1>
      <div className="flex justify-end space-x-4 mb-8">
        <button
          onClick={exportToPDF}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Export to PDF
        </button>
        <button
          onClick={exportToExcel}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Export to Excel
        </button>
      </div>
      <div className="flex justify-center mb-8">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-white p-2 rounded-lg border border-gray-300"
        >
          <option value="all">All</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Feedback Ratings</h2>
          <Bar data={ratingData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Feedback by Location</h2>
          <Bar data={locationData} />
        </div>
      </div>
      <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">All Feedback</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Location</th>
              <th className="py-2 px-4 border-b">Rating</th>
              <th className="py-2 px-4 border-b">Reasons</th>
              <th className="py-2 px-4 border-b">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedback().map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{item.location}</td>
                <td className="py-2 px-4 border-b">{item.rating}</td>
                <td className="py-2 px-4 border-b">{item.reasons}</td>
                <td className="py-2 px-4 border-b">
                  {new Date(item.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;