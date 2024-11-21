const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URL for Hugging Face API
const BASE_URL = "https://huggingface.co/api/spaces";

// Read CSV file
const readCSV = (filename) => {
    const filepath = path.join(__dirname, `../data/${filename}`);
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n').slice(1).filter(line => line.trim() !== ''); // Skip the header
    return lines.map(line => {
        const [model_name, spaces_count, spaces] = line.split(',');
        return {
            model_name,
            spaces_count: parseInt(spaces_count, 10),
            spaces: spaces ? spaces.replace(/"/g, '').split('|') : []
        };
    });
};

// Function to fetch source code size for a single space
const fetchSpaceCodeSize = async (spaceId) => {
    try {
        const response = await axios.get(`${BASE_URL}/${spaceId}/tree/main?recursive=true`);
        const files = response.data;

        // Define a regex tp ignore image and video file extensions (Assuming they are examples) and may unneccesarily increase
        // source-code size
        const excludedExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp|mp4|mkv|mov|avi|wmv|flv|webm)$/i;

        let totalSize = 0;
        for (const file of files) {
            // Skip files that match excluded extensions
            if (file.size && !file.path.match(excludedExtensions)) {
                totalSize += file.size; // Accumulate size in bytes
            }
        }

        return totalSize; // Total size in bytes
    } catch (error) {
        console.error(`Error fetching code size for space '${spaceId}': `, error.message);
        return 0; // Return 0 on error
    }
};

// Save data to CSV
const saveToCSV = (data, filename) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = path.join(__dirname, `../data/${filename.replace('.csv', `_${timestamp}.csv`)}`);
    const csvHeader = 'model_name,space_id,source_code_size_kb\n';
    const csvRows = data.map(row => `${row.model_name},${row.space_id},${(row.source_code_size / 1024).toFixed(2)}`).join('\n');
    const csvContent = csvHeader + csvRows;

    fs.writeFileSync(filepath, csvContent, 'utf8');
    console.log(`Data saved to ${filepath}`);
};

// Main function
const main = async () => {
    console.log('----------------------Reading model data... ------------------');
    const imageModels = readCSV('image_spaces_2024-11-20T12-21-02-567Z.csv'); // Image spaces CSV file, this may change as it has timestamp of generation
    const videoModels = readCSV('video_spaces_2024-11-20T12-21-02-569Z.csv'); // Video spaces CSV file, this may change as it has timestamp of generation

    const imageSpacesData = [];
    console.log('--------------------Fetching source code size for image spaces ------------------');
    for (const model of imageModels) {
        for (const spaceId of model.spaces) {
            const sourceCodeSize = await fetchSpaceCodeSize(spaceId);
            imageSpacesData.push({ model_name: model.model_name, space_id: spaceId, source_code_size: sourceCodeSize });
            console.log(`Fetched source code size for image space: ${spaceId} - ${(sourceCodeSize / 1024).toFixed(2)} KB`);
        }
    }

    const videoSpacesData = [];
    console.log('--------------------Fetching source code size for video spaces ------------------');
    for (const model of videoModels) {
        for (const spaceId of model.spaces) {
            const sourceCodeSize = await fetchSpaceCodeSize(spaceId);
            videoSpacesData.push({ model_name: model.model_name, space_id: spaceId, source_code_size: sourceCodeSize });
            console.log(`Fetched source code size for video space: ${spaceId} - ${(sourceCodeSize / 1024).toFixed(2)} KB`);
        }
    }

    saveToCSV(imageSpacesData, 'image_spaces_with_sizes.csv');
    saveToCSV(videoSpacesData, 'video_spaces_with_sizes.csv');
    console.log('Spaces source code sizes saved successfully!');
};

main();
