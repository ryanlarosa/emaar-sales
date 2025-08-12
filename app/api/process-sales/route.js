// File: app/api/process-sales/route.js

import { NextResponse } from "next/server";

// Helper function to format the date as DD-Mon-YYYY
const formatDateForLinga = (isoDate) => {
  const date = new Date(isoDate);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);

  const day = String(correctedDate.getDate()).padStart(2, "0");
  const month = correctedDate.toLocaleString("en-GB", { month: "short" });
  const year = correctedDate.getFullYear();
  return `${day}-${month}-${year}`;
};

export async function POST(request) {
  const { fromDate, toDate } = await request.json();

  if (!fromDate || !toDate) {
    return NextResponse.json(
      { error: "Please provide a 'From' and 'To' date." },
      { status: 400 }
    );
  }

  const fromDateFormatted = formatDateForLinga(fromDate);
  const toDateFormatted = formatDateForLinga(toDate);
  const tenderOption = "By Tender Name";
  // The complete and final URL for the API call
  const lingaApiUrl = `https://api.lingaros.com/v1/lingapos/store/62bac76eda6ec1a3cd72a67f/transactionReport?dateOption=DR&fromDate=${fromDateFormatted}&toDate=${toDateFormatted}&tenderOption=${tenderOption}`;

  try {
    console.log(`Fetching complete report from Linga API: ${lingaApiUrl}`);

    // Making a single, direct call with the correct Authorization header.
    const lingaResponse = await fetch(lingaApiUrl, {
      headers: {
        apikey: process.env.LINGA_API_KEY,
      },
    });

    if (!lingaResponse.ok) {
      const errorText = await lingaResponse.text();
      console.error("Linga API Error:", errorText);
      throw new Error(
        `Linga API request failed with status ${lingaResponse.status}.`
      );
    }

    const allTransactions = await lingaResponse.json();
    console.log(`Successfully fetched ${allTransactions.length} records.`);

    if (!Array.isArray(allTransactions) || allTransactions.length === 0) {
      throw new Error(
        "No transactions found or the response was not in the expected array format."
      );
    }

    let grossTotalSales = 0;
    const uniqueSaleNumbers = new Set();
    let grossDeliverooSales = 0;
    const deliverooTransactions = new Set();
    let grossDineInSales = 0;
    const dineInTransactions = new Set();
    let deliverooCount = 0;
    let dineInCount = 0;

    // **THE FIX: Explicitly remove the last item from the array before processing.**
    // This is the most reliable way to exclude the summary row and fix the count.
    const transactionItems = allTransactions.slice(0, -1);

    for (const item of transactionItems) {
      // We can still keep this as a safeguard, but the slice is doing the main work.
      if (
        !item.saleNumber ||
        !item.tender ||
        typeof item.amount === "undefined"
      ) {
        continue;
      }

      const amount = parseFloat(item.amount.replace(/,/g, ""));
      const saleNumber = item.saleNumber;
      const tender = item.tender.toLowerCase();

      // Add to totals
      grossTotalSales += amount;
      uniqueSaleNumbers.add(saleNumber);

      // Split by tender type
      if (tender.includes("deliveroo")) {
        grossDeliverooSales += amount;
        deliverooCount++;
      } else {
        grossDineInSales += amount;
        dineInCount++;
      }
    }

    // Applying the VAT calculation as you requested in your last code version.
    const netTotalSales = grossTotalSales / 1.05;
    const netDeliverooSales = grossDeliverooSales / 1.05;
    const netDineInSales = grossDineInSales / 1.05;

    const emaarPayload = {
      SalesDataCollection: {
        SalesInfo: [
          {
            UnitNo: "DHM-FF-143",
            LeaseCode: "t0013323",
            SalesDateFrom: fromDate,
            SalesDateTo: toDate,
            TransactionCount: String(deliverooCount + dineInCount),
            TotalSales: netTotalSales.toFixed(2),
            Remarks: "none",
            FandBSplit: [
              {
                Ch_Deliveroo: netDeliverooSales.toFixed(2),
                Ch_DineIn: netDineInSales.toFixed(2),
                Ch_Deliveroocnt: deliverooCount,
                Ch_DineIncnt: dineInCount,
              },
            ],
          },
        ],
      },
    };

    return NextResponse.json(emaarPayload);
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return NextResponse.json(
      { error: error.message || "An internal server error occurred." },
      { status: 500 }
    );
  }
}
