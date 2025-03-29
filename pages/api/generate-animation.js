const formidable = require("formidable");
const fs = require("fs");
const axios = require("axios");

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  const form = new formidable.IncomingForm({ keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);
    const prompt = fields.prompt?.toString().trim() || "a whimsical Studio Ghibli animation";
    const imageFile = files.image?.[0] || files.image;

    if (!imageFile) {
      return res.status(400).json({ error: "Image is required for this model." });
    }

    const buffer = fs.readFileSync(imageFile.filepath);
    const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;

    // Optional log for debugging
    console.log("Prompt:", prompt);
    console.log("Image length:", base64Image.length);
    console.log("Base64 starts with:", base64Image.substring(0, 30));

    const replicateResponse = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "4b7b8f3235fa0a3d3a395b291ae585f8db813eb35ee81ee1a5f6e46513bede6a",
        input: {
          image: base64Image,
          prompt,
          seed: 42,
          num_frames: 16,
          fps: 8
        },
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const prediction = replicateResponse.data;
    let outputUrl = null;

    while (!outputUrl) {
      const poll = await axios.get(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          },
        }
      );

      if (poll.data.status === "succeeded") {
        outputUrl = poll.data.output?.[0];
      } else if (poll.data.status === "failed") {
        return res.status(500).json({ error: "Image-to-video generation failed" });
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    return res.status(200).json({ videoUrl: outputUrl });
  } catch (error) {
    console.error("Replicate API error:", error?.response?.data || error.message);
    return res.status(500).json({
      error: error?.response?.data?.error || error?.message || "Unexpected server error",
    });
  }
}
