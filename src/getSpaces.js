const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://huggingface.co/api'

//Function to read models from CSV
const readCSV = (filename) => {
    const filepath = path.join(__dirname, `../data/${filename}`);
    const content = fs.readFileSync(filepath, 'utf8'); // Read as string
    const lines = content.split('\n'); // Split into lines
    const header = lines.shift(); // Remove and ignore the header line
    return lines
        .filter(line => line.trim() !== '') // Filter out empty lines
        .map(line => {
            const [model_name, downloads, tags] = line.split(',');
            return {
                model_name: model_name.trim(),
                downloads: parseInt(downloads, 10) || 0, // Handle possible NaN
                tags: tags ? tags.trim() : '' // Handle possible missing tags
            };
        });
};

// Function to fetch spaces for a model
const fetchSpacesForModel = async (modelName) => {
    try {
        const response = await axios.get(`${BASE_URL}/models/${modelName}`);
        const spaces = response.data.spaces; // Array of strings

        return { spaces_count: spaces.length, space_names: spaces }; // Directly return count and names
    } catch (error) {
        console.error(`Error while fetching spaces for ${modelName}: `, error.message);
        return { spaces_count: 0, space_names: [] };
    }
};

// Save Spaces data to CSV with a timestamped filename
const saveToCSV = (data, filename) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = path.join(__dirname, `../data/${filename.replace('.csv', `_${timestamp}.csv`)}`);
    const csvHeader = 'model_name,spaces_count,spaces\n';

    const csvRows = data.map(row => {
        const spaceList = (row.space_names || []).join('|'); // Ensure space_names is defined and is an array
        return `${row.model_name},${row.spaces_count},"${spaceList}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    fs.writeFileSync(filepath, csvContent, 'utf8');
    console.log(`Data saved to ${filepath}`);
};

//Main function to call the above fetch and process space data
const main = async () => {
    console.log('----------------------Reading model data... ------------------');
    const imageModels = readCSV('image_models_2024-11-20T09-01-07-845Z.csv'); // Filename of image models in Data folder
    const videoModels = readCSV('video_models_2024-11-20T09-01-07-847Z.csv'); // Filename of video models in Data folder

    console.log('--------------------Fetching spaces for image models ------------------');
    const imageSpaces = [];
    for (const model of imageModels) { // Looping through all the models and fetching count and names of spaces
        const { spaces_count, space_names } = await fetchSpacesForModel(model.model_name);
        imageSpaces.push({ model_name: model.model_name, spaces_count, space_names });
        console.log(`Fetched ${spaces_count} Spaces for image model: ${model.model_name}`);
    }

    console.log('--------------------Fetching spaces for video models ... ------------------');
    const videoSpaces = [];
    for (const model of videoModels) {
        const { spaces_count, space_names } = await fetchSpacesForModel(model.model_name);
        videoSpaces.push({ model_name: model.model_name, spaces_count, space_names });
        console.log(`Fetched ${spaces_count} Spaces for video model: ${model.model_name}`);
    }

    console.log('--------------------Saving spaces data to CSV... ------------------');
    saveToCSV(imageSpaces, 'image_spaces.csv');
    saveToCSV(videoSpaces, 'video_spaces.csv');
    console.log('Spaces data saved successfully!');
};

main();


