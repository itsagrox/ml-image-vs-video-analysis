const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://huggingface.co/api' //Huggingface's public endpoint

/**
 * @param {string} task - The task type (e.g., "image-classification", "video-classification").
 * @param {string} sortBy - Sorting parameter (e.g., "downloads or likes").
 * @param {number} limit - Number of models to fetch (in our case top 20).
 * @returns {Promise<Array>} - List of models.
 */

//We are fetching "image-classification" and "video-classification" models directly from huggingface's public apis
const fetchModels = async (type, sortBy = 'downloads', limit = 20) => {
    try {
        const response = await axios.get(`${BASE_URL}/models?filter=${type}&sort=${sortBy}&limit=${limit}`);
        const models = response.data;

        return models.map(model => ({
            model_name: model.modelId,
            downloads: model.downloads || 0,
            likes: model.likes || 0,
            tags: model.tags || []
        }))

    } catch (error) {
        console.log(`Error while fetching: ${error.message} `)
        return [];
    }
}

/**
 * Save fetched data to a CSV file.
 * @param {Array} data - Data to save.
 * @param {string} filename - File name to save data as.
 */

const saveToCSV = (data, filename) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format timestamp for filenames
    const csvFileName = `${filename.replace('.csv', '')}_${timestamp}.csv` // Added timestamp in the filename to prevent overriding of files on multiple script runs.
    const csvHeader = 'model_name,downloads,likes,tags\n';
    const csvRows = data.map(row => `${row.model_name},${row.downloads},${row.likes},"${row.tags.join(', ')}"`).join('\n');
    const csvContent = csvHeader + csvRows;

    fs.writeFileSync(path.join(__dirname, `../data/${csvFileName}`), csvContent, 'utf8');
}

const main = async () => {
    const imageModels = await fetchModels('image-classification'); //Calling out fetch to get top-20 image processing models
    const videoModels = await fetchModels('video-classification'); //Calling out fetch to get top-20 video processing models

    saveToCSV(imageModels, 'image_models.csv'); //Calling function to save image processing models to csv 
    saveToCSV(videoModels, 'video_models.csv'); //Calling function to save video processing models to csv 
    console.log("Model data saved to CSV.");
};

main();