import { NextResponse } from 'next/server';

// This function handles POST requests to /api/execute
export async function POST(request: Request) {
  try {
    // Parse the request body to get the code and language
    const { code, language } = await request.json();

    // Basic validation
    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required.' },
        { status: 400 }
      );
    }

    // Map our friendly language names to Judge0's language IDs
    // You can find more IDs here: https://ce.judge0.com/languages
    const languageMap: { [key: string]: number } = {
      javascript: 93, // Node.js
      typescript: 94, // TypeScript
      python: 71,     // Python 3.8.1
      java: 62,       // Java (OpenJDK 13.0.1)
      html: -1, // HTML is client-side, cannot be executed on server
      css: -1, // CSS is client-side, cannot be executed on server
    };

    const languageId = languageMap[language.toLowerCase()];

    if (languageId === undefined) {
      return NextResponse.json(
        { error: `Language "${language}" is not supported.` },
        { status: 400 }
      );
    }
    
    if (languageId === -1) {
        return NextResponse.json(
            { output: "HTML and CSS are rendered in the browser and cannot be executed on the server." },
            { status: 200 }
        );
    }

    // Securely get the API key from environment variables
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is not configured on the server.' },
        { status: 500 }
      );
    }
    
    // 1. Create a submission to Judge0
    const submissionResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
      }),
    });

    if (!submissionResponse.ok) {
        const errorText = await submissionResponse.text();
        console.error("Judge0 submission error:", errorText);
        return NextResponse.json({ error: `Failed to create submission. API responded with status ${submissionResponse.status}` }, { status: 500 });
    }

    const submissionResult = await submissionResponse.json();
    const { token } = submissionResult;

    if (!token) {
        return NextResponse.json({ error: 'Failed to get submission token from Judge0.' }, { status: 500 });
    }

    // 2. Poll for the submission result using the token
    let resultResponse;
    let resultData;
    let statusId = 1; // 1 = In Queue, 2 = Processing

    // Poll every 2 seconds until the status is no longer "In Queue" or "Processing"
    while (statusId === 1 || statusId === 2) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds

        resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
        });

        if (!resultResponse.ok) {
            return NextResponse.json({ error: `Failed to fetch submission result. API responded with status ${resultResponse.status}` }, { status: 500 });
        }
        
        resultData = await resultResponse.json();
        statusId = resultData.status.id;
    }

    // 3. Return the final result
    return NextResponse.json({
      output: resultData.stdout,
      error: resultData.stderr,
      compile_output: resultData.compile_output,
      status: resultData.status.description,
      time: resultData.time,
      memory: resultData.memory,
    }, { status: 200 });


  } catch (error) {
    console.error('Error in /api/execute:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred on the server.' },
      { status: 500 }
    );
  }
}
