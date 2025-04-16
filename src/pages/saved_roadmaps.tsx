import React, { useState, useEffect } from 'react';
import Title from "../components/title";
import DynamicRoadmap from "../components/roadmap";
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface Task {
    id: number;
    name_of_the_task: string;
    description: string;
    dependencies: number[];
    estimated_duration: number;
}

interface TasksData {
    [key: string]: Task;
}

interface SavedRoadmap {
    id: string;
    map: string;
    createdAt: string;
    title: string | null;
}

const SavedRoadmaps: React.FC = () => {
    const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTitle, setEditingTitle] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');

    useEffect(() => {
        fetchRoadmaps();
    }, []);

    const fetchRoadmaps = async () => {
        try {
            const { data: roadmaps, errors } = await client.models.roadmap.list();
            
            if (errors) {
                console.error('Error fetching roadmaps:', errors);
                return;
            }

            if (roadmaps && roadmaps.length > 0) {
                // Convert the roadmaps to match our SavedRoadmap interface
                const formattedRoadmaps = roadmaps.map(roadmap => ({
                    id: roadmap.id,
                    map: roadmap.map,
                    createdAt: roadmap.createdAt,
                    title: roadmap.title || null
                }));
                setSavedRoadmaps(formattedRoadmaps);
            } else {
                console.log('No roadmaps found in the database');
                setSavedRoadmaps([]);
            }
        } catch (error) {
            console.error('Error fetching roadmaps:', error);
            // If there's an error, try to fetch without the title field
            try {
                const { data: roadmaps } = await client.models.roadmap.list({
                    selectionSet: ['id', 'map', 'createdAt']
                });
                if (roadmaps) {
                    const formattedRoadmaps = roadmaps.map(roadmap => ({
                        id: roadmap.id,
                        map: roadmap.map,
                        createdAt: roadmap.createdAt,
                        title: null
                    }));
                    setSavedRoadmaps(formattedRoadmaps);
                }
            } catch (fallbackError) {
                console.error('Error in fallback fetch:', fallbackError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRoadmap = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this roadmap?')) {
            try {
                const result = await client.models.roadmap.delete({
                    id: id
                });

                if (result.errors) {
                    console.error('Error deleting roadmap:', result.errors);
                    alert('Error deleting roadmap. Please try again.');
                    return;
                }

                setSavedRoadmaps(prev => prev.filter(roadmap => roadmap.id !== id));
                alert('Roadmap deleted successfully!');
            } catch (error) {
                console.error('Error deleting roadmap:', error);
                alert('Error deleting roadmap. Please try again.');
            }
        }
    };

    const handleEditTitle = async (roadmapId: string, newTitle: string) => {
        try {
            const result = await client.models.roadmap.update({
                id: roadmapId,
                title: newTitle || null
            });

            if (result.errors) {
                console.error('Error updating roadmap title:', result.errors);
                alert('Error updating roadmap title. Please try again.');
                return;
            }

            // Update the local state
            setSavedRoadmaps(prev => prev.map(roadmap => 
                roadmap.id === roadmapId ? { ...roadmap, title: newTitle || null } : roadmap
            ));
            setEditingTitle(null);
            setNewTitle('');
        } catch (error) {
            console.error('Error updating roadmap title:', error);
            alert('Error updating roadmap title. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <Title text="Saved Roadmaps" size="lg" />
                    <div className="mt-8 text-center">
                        <p className="text-gray-600">Loading roadmaps...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <Title text="Saved Roadmaps" size="lg" />
                
                {isLoading ? (
                    <div className="mt-8 text-center">
                        <p className="text-gray-600">Loading roadmaps...</p>
                    </div>
                ) : savedRoadmaps.length === 0 ? (
                    <div className="mt-8 text-center">
                        <p className="text-gray-600">No saved roadmaps found.</p>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-6">
                        {savedRoadmaps.map((roadmap) => {
                            try {
                                // First, log the raw map data to understand its structure

                                // Parse the map data if it's a string, otherwise use it directly
                                let mapData;
                                if (typeof roadmap.map === 'string') {
                                    try {
                                        // First try normal JSON parsing
                                        mapData = JSON.parse(roadmap.map);
                                    } catch (parseError) {
                                        console.error('Error parsing map data:', parseError);
                                        // If parsing fails, try to fix the string format
                                        let fixedMapString = roadmap.map;
                                        
                                        // Replace = with : for key-value pairs
                                        fixedMapString = fixedMapString.replace(/(\w+)=/g, '"$1":');
                                        
                                        // Add quotes around string values
                                        fixedMapString = fixedMapString.replace(/([a-zA-Z0-9\s]+)([,}])/g, '"$1"$2');
                                        
                                        
                                        // Wrap the entire object in quotes
                                        fixedMapString = `{${fixedMapString}}`;
                                        
                                        try {
                                            mapData = JSON.parse(fixedMapString);
                                        } catch (secondParseError) {
                                            console.error('Error in second parse attempt:', secondParseError);
                                            throw new Error('Failed to parse roadmap data');
                                        }
                                    }
                                } else {
                                    mapData = roadmap.map;
                                }

                                // Convert the tasks array to the expected TasksData format
                                const tasksData: TasksData = {};
                                if (mapData && mapData.tasks && Array.isArray(mapData.tasks)) {
                                    mapData.tasks.forEach((task: any) => {
                                        if (task && typeof task.id !== 'undefined') {
                                            // Handle dependencies that could be string, number, or array
                                            let dependencies: number[] = [];
                                            if (typeof task.dependencies === 'string' && task.dependencies !== "") {
                                                // If it's a non-empty string, try to parse it
                                                try {
                                                    const parsed = JSON.parse(task.dependencies);
                                                    dependencies = Array.isArray(parsed) ? parsed : [parsed];
                                                } catch (e) {
                                                    // If parsing fails, treat it as a single dependency
                                                    dependencies = [parseInt(task.dependencies)];
                                                }
                                            } else if (typeof task.dependencies === 'number') {
                                                dependencies = [task.dependencies];
                                            } else if (Array.isArray(task.dependencies)) {
                                                dependencies = task.dependencies;
                                            }

                                            tasksData[task.id.toString()] = {
                                                id: task.id,
                                                name_of_the_task: task.name_of_the_task || 'Unnamed Task',
                                                description: task.description || 'No description available',
                                                dependencies: dependencies,
                                                estimated_duration: task.estimated_duration || 0
                                            };
                                        }
                                    });
                                }

                                // Only render if we have valid tasks data
                                if (Object.keys(tasksData).length > 0) {
                                    return (
                                        <div key={roadmap.id} className="bg-white rounded-xl shadow-sm p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex-1">
                                                    {editingTitle === roadmap.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={newTitle}
                                                                onChange={(e) => setNewTitle(e.target.value)}
                                                                className="border rounded px-2 py-1 flex-1"
                                                                placeholder="Enter new title"
                                                            />
                                                            <button
                                                                onClick={() => handleEditTitle(roadmap.id, newTitle)}
                                                                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingTitle(null);
                                                                    setNewTitle('');
                                                                }}
                                                                className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <h2 className="text-xl font-semibold text-gray-800">
                                                                {roadmap.title || `Roadmap created on ${new Date(roadmap.createdAt).toLocaleDateString()}`}
                                                            </h2>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingTitle(roadmap.id);
                                                                    setNewTitle(roadmap.title || '');
                                                                }}
                                                                className="text-blue-500 hover:text-blue-700"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    <p className="text-sm text-gray-500">
                                                        ID: {roadmap.id}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteRoadmap(roadmap.id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                            <div className="mt-4">
                                                <DynamicRoadmap tasksData={tasksData} />
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={roadmap.id} className="bg-white rounded-xl shadow-sm p-6">
                                            <div className="text-yellow-500">
                                                No valid tasks found in this roadmap
                                            </div>
                                        </div>
                                    );
                                }
                            } catch (error) {
                                console.error('Error processing roadmap data:', error);
                                return (
                                    <div key={roadmap.id} className="bg-white rounded-xl shadow-sm p-6">
                                        <div className="text-red-500">
                                            Error loading roadmap data
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedRoadmaps; 