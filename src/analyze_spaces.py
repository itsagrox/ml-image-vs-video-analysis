import pandas as pd
import matplotlib.pyplot as plt
import os

# Load CSV files
image_model_data = pd.read_csv('../data/image_spaces_2024-11-20T12-21-02-567Z.csv')  # model_name, spaces_count, spaces
video_model_data = pd.read_csv('../data/video_spaces_2024-11-20T12-21-02-569Z.csv')  # model_name, spaces_count, spaces

image_source_data = pd.read_csv('../data/image_spaces_with_sizes_2024-11-20T17-54-29-487Z.csv')  # model_name, space_id, source_code_size_kb
video_source_data = pd.read_csv('../data/video_spaces_with_sizes_2024-11-20T17-54-29-489Z.csv')  # model_name, space_id, source_code_size_kb

# Function to handle potential 'NaN' or malformed data in 'spaces' column
def safe_split_spaces(spaces_value):
    if isinstance(spaces_value, str):
        return spaces_value.split('|')
    elif pd.isna(spaces_value):
        return []  # Return an empty list for missing values
    else:
        return []  # Handle other unexpected types

# 1. Calculate Total Number of Spaces in Image Models
total_image_spaces = image_model_data['spaces_count'].sum()

# 2. Calculate Total Number of Spaces in Video Models
total_video_spaces = video_model_data['spaces_count'].sum()

# 3. Calculate Average Source Code Size for Image Spaces
# Flattening the space and source code size data for image models
image_spaces_with_size = []
for _, row in image_model_data.iterrows():
    model_name = row['model_name']
    spaces = safe_split_spaces(row['spaces'])  # Use the safe_split_spaces function
    
    # Get source code size for each space
    for space in spaces:
        # Find the corresponding source code size for the space
        space_data = image_source_data[image_source_data['model_name'] == model_name]
        space_data_for_space = space_data[space_data['space_id'] == space]
        
        if not space_data_for_space.empty:
            source_code_size_kb = space_data_for_space['source_code_size_kb'].values[0]
            image_spaces_with_size.append(source_code_size_kb)

# Calculate average source code size for image spaces
average_image_size = sum(image_spaces_with_size) / len(image_spaces_with_size) if image_spaces_with_size else 0

# 4. Calculate Average Source Code Size for Video Spaces
# Flattening the space and source code size data for video models
video_spaces_with_size = []
for _, row in video_model_data.iterrows():
    model_name = row['model_name']
    spaces = safe_split_spaces(row['spaces'])  # Use the safe_split_spaces function
    
    # Get source code size for each space
    for space in spaces:
        # Find the corresponding source code size for the space
        space_data = video_source_data[video_source_data['model_name'] == model_name]
        space_data_for_space = space_data[space_data['space_id'] == space]
        
        if not space_data_for_space.empty:
            source_code_size_kb = space_data_for_space['source_code_size_kb'].values[0]
            video_spaces_with_size.append(source_code_size_kb)

# Calculate average source code size for video spaces
average_video_size = sum(video_spaces_with_size) / len(video_spaces_with_size) if video_spaces_with_size else 0

# 5. Prepare Data to Save to Excel
# First sheet: Total number of spaces
total_spaces_data = {
    'Model Type': ['Image Models', 'Video Models'],
    'Total Spaces': [total_image_spaces, total_video_spaces]
}

total_spaces_df = pd.DataFrame(total_spaces_data)

# Second sheet: Average source code size
average_source_size_data = {
    'Model Type': ['Image Spaces', 'Video Spaces'],
    'Average Source Code Size (KB)': [average_image_size, average_video_size]
}

average_source_size_df = pd.DataFrame(average_source_size_data)

# Create the 'results' directory if it doesn't exist
results_dir = os.path.join(os.path.dirname(__file__), '..', 'results')
os.makedirs(results_dir, exist_ok=True)

# Save the results to an Excel file in the 'results' folder
output_file = os.path.join(results_dir, 'model_analysis_results.xlsx')

with pd.ExcelWriter(output_file) as writer:
    total_spaces_df.to_excel(writer, sheet_name='Total Spaces', index=False)
    average_source_size_df.to_excel(writer, sheet_name='Average Source Code Size', index=False)

print(f"Results saved to {output_file}")

# 6. Generate Graphs
# Graph 1: Total Spaces in Image vs Video Models
plt.figure(figsize=(6, 4))
plt.bar(['Image Models', 'Video Models'], [total_image_spaces, total_video_spaces], color=['blue', 'orange'])
plt.title('Total Number of Spaces in Image vs Video Models')
plt.xlabel('Model Type')
plt.ylabel('Total Spaces')
plt.tight_layout()
plot_path = os.path.join(results_dir, 'total_spaces_image_vs_video.png')
plt.savefig(plot_path)
plt.show()

# Graph 2: Average Source Code Size in Image vs Video Models
plt.figure(figsize=(6, 4))
plt.bar(['Image Spaces', 'Video Spaces'], [average_image_size, average_video_size], color=['blue', 'orange'])
plt.title('Average Source Code Size in Image vs Video Spaces')
plt.xlabel('Model Type')
plt.ylabel('Average Source Code Size (KB)')
plt.tight_layout()
plot_path=os.path.join(results_dir, 'average_source_code_size_image_vs_video.png')
plt.savefig(plot_path)
plt.show()