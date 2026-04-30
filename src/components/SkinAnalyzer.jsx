import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";

const SkinAnalyzer = () => {
  const [model, setModel] = useState(null);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [labels, setLabels] = useState([]);

  // Load model + metadata
  useEffect(() => {
    const loadModel = async () => {
      // Adjusted paths to point to the root of public folder
      // where model.json and metadata.json are actually located
      const loadedModel = await tf.loadLayersModel("/model.json");
      setModel(loadedModel);

      const metadata = await fetch("/metadata.json");
      const meta = await metadata.json();
      setLabels(meta.labels);
    };

    loadModel();
  }, []);

  // Handle image upload
  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(URL.createObjectURL(file));
  };

  // Predict
  const predict = async () => {
    if (!model || !image) return alert("Upload image first");

    const img = document.getElementById("preview");

    const tensor = tf.browser.fromPixels(img)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .div(255.0)
      .expandDims();

    const prediction = await model.predict(tensor).data();

    const maxIndex = prediction.indexOf(Math.max(...prediction));
    setResult(`${labels[maxIndex]} (${(prediction[maxIndex] * 100).toFixed(2)}%)`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>AI Skin Analyzer</h2>

      <input type="file" onChange={handleImage} />

      {image && (
        <img
          id="preview"
          src={image}
          alt="preview"
          width="200"
          style={{ marginTop: "10px" }}
        />
      )}

      <br />
      <button onClick={predict}>Analyze Skin</button>

      <h3>Result: {result}</h3>
    </div>
  );
};

export default SkinAnalyzer;
