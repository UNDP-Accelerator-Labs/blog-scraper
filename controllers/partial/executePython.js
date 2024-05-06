const { spawn } = require("child_process");

const executePythonScriptAndGetMetadata = async () => {
  let pythonOutput = "";

  const executePythonScript = async () => {
    const pythonProcess = await spawn("python3", ["scripts/parsers/pdf.py"]);

    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data;
    });

    // Listen for errors from the Python script (stderr)
    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python stderr: ${data}`);
    });

    return new Promise((resolve, reject) => {
      // Listen for Python script exit
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve(pythonOutput.trim());
        } else {
          reject(new Error(`Python process exited with code ${code}`));
        }
      });
    });
  };

  try {
    const pythonOutput = await executePythonScript();
    if (pythonOutput === "null") {
      console.log("No metadata found in document files.");
    } else {
      try {
        const metadata = JSON.parse(pythonOutput);
        return metadata;
      } catch (error) {
        console.error("Error parsing metadata:", pythonOutput);
      }
    }
  } catch (error) {
    console.error("Error executing Python script:", error);
  }

  return null; // Return null if any error occurs
};

module.exports = executePythonScriptAndGetMetadata;
