import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../configs/firebase";

export default function History() {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null); // modal state

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const currentUserId = localStorage.getItem("userId");
        const deliveriesSnapshot = await getDocs(collection(db, "deliveries"));

        const matchedHistory = [];

        for (const deliveryDoc of deliveriesSnapshot.docs) {
          const deliveryData = deliveryDoc.data();
          const haulerId = deliveryData.haulerAssignedId;
          const requestId = deliveryData.requestId;

          const userQuery = query(
            collection(db, "users"),
            where("userId", "==", haulerId)
          );
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const haulerData = userSnapshot.docs[0].data();
            if (haulerData.businessId === currentUserId) {
              const requestRef = doc(db, "deliveryRequests", requestId);
              const requestSnap = await getDoc(requestRef);

              if (requestSnap.exists()) {
                const requestData = requestSnap.data();
                matchedHistory.push({
                  id: deliveryDoc.id,
                  haulerName: `${haulerData.firstName} ${haulerData.lastName}`,
                  farmerName: requestData.farmerName,
                  productType: requestData.productType,
                  purpose: requestData.purpose,
                  timestamp: requestData.timestamp?.toDate().toLocaleString() || "No timestamp",
                  pickupLocation: requestData.pickupLocation,
                  destinationLocation: requestData.destinationLocation,
                });
              }
            }
          }
        }

        setHistoryData(matchedHistory);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="antialiased bg-white flex flex-col items-center min-h-screen py-10">
      <div className="container mx-auto px-4 sm:px-8">
        <h1 className="text-2xl font-bold text-[#1A4D2E] mb-6">Delivery History</h1>

        {isLoading ? (
          <p className="text-center text-gray-600">Loading history...</p>
        ) : historyData.length === 0 ? (
          <p className="text-center text-gray-600">No delivery history found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 shadow-md rounded">
              <thead className="bg-[#F5EFE6] text-[#1A4D2E] uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4 border-b text-left">Hauler Assigned</th>
                  <th className="py-3 px-4 border-b text-left">Farmer Name</th>
                  <th className="py-3 px-4 border-b text-left">Product Type</th>
                  <th className="py-3 px-4 border-b text-left">Purpose</th>
                  <th className="py-3 px-4 border-b text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((entry) => (
                  <tr
                    key={entry.id}
                    className="text-gray-800 border-b hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <td className="py-3 px-4">{entry.haulerName}</td>
                    <td className="py-3 px-4">{entry.farmerName}</td>
                    <td className="py-3 px-4">{entry.productType}</td>
                    <td className="py-3 px-4">{entry.purpose}</td>
                    <td className="py-3 px-4">{entry.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-white bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
            <h2 className="text-xl font-semibold text-[#1A4D2E] mb-4">Delivery Details</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li><strong>Hauler Assigned:</strong> {selectedEntry.haulerName}</li>
              <li><strong>Farmer Name:</strong> {selectedEntry.farmerName}</li>
              <li><strong>Product Type:</strong> {selectedEntry.productType}</li>
              <li><strong>Purpose:</strong> {selectedEntry.purpose}</li>
              <li><strong>Timestamp:</strong> {selectedEntry.timestamp}</li>
              <li><strong>Pickup Location:</strong> {selectedEntry.pickupLocation}</li>
              <li><strong>Destination Location:</strong> {selectedEntry.destinationLocation}</li>
            </ul>
            <button
              onClick={() => setSelectedEntry(null)}
              className="mt-6 bg-[#1A4D2E] text-white px-4 py-2 rounded hover:bg-green-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
