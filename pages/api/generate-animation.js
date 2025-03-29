import formidable from "formidable";
import fs from "fs";
import axios from "axios";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(400).json({ error: "Invalid form data" });
    }

    const prompt = fields.prompt?.toString().trim();
    const imageFile = files.image?.[0] || files.image;

    if (!prompt && !imageFile) {
      return res.status(400).json({ error: "Prompt or image required." });
    }

    try {
      let base64Image = null;
      if (imageFile) {
        const buffer = fs.readFileSync(imageFile.filepath);
        base64Image = `data:image/png;base64,${buffer.toString("base64")}`;
      }

      const replicateResponse = await axios.post(
        "https://api.replicate.com/v1/predictions",
        {
          version: "cjwbw/animatediff:8f1d6de084aa0b63245a7e91e99d30ff74a7e8f3d83f7c4f96cf48b4ad8f54e4",
          input: {
            prompt: `Studio Ghibli style, cinematic light, watercolor look: ${prompt || "Image-based animation"}`,
            num_frames: 40,
            fps: 8,
            guidance_scale: 10,
            ...(base64Image && { image: base64Image }),
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
          return res.status(500).json({ error: "Animation generation failed" });
        } else {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      return res.status(200).json({ videoUrl: outputUrl });
    } catch (error) {
      console.error("API error:", error);
      return res.status(500).json({ error: "Failed to generate animation" });
    }
  });
}