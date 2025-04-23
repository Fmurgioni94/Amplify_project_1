import { useState, useEffect, useCallback, useRef } from "react";
import Title from "../components/title.tsx";
import WelcomeMessage from "../components/welcomeMessage.tsx";
import TextInput from "../components/input_bar.tsx";
import Button from "../components/button.tsx";
import DynamicRoadmap from "../components/roadmap.tsx";
import PreferencesSettingPage from './preferences_setting_page';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// Define the Task interface
interface Task {
  name_of_the_task: string;
  id: number;
  description: string;
  dependencies: number[];
  estimated_duration: number;
}

interface TasksData {
  [key: string]: Task;
}

function Home() {
    // const navigate = useNavigate();
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [roadmapData, setRoadmapData] = useState<TasksData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number>();
    const isMountedRef = useRef(false);
    const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
    const [pendingGoal, setPendingGoal] = useState<string>("");
    // const [savedRoadmaps, setSavedRoadmaps] = useState<TasksData[]>([]);

    const setupWebSocket = useCallback(() => {
        // Don't setup if not mounted
        if (!isMountedRef.current) return null;

        // Clear any existing connection
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        try {
            const ws = new WebSocket("wss://1e2wwsnu5d.execute-api.eu-west-2.amazonaws.com/production/");

            ws.onopen = () => {
                if (isMountedRef.current) {
                    console.log('WebSocket Connected');
                    setIsConnected(true);
                }
            };

            ws.onclose = () => {
                if (isMountedRef.current) {
                    console.log('WebSocket Disconnected');
                    setIsConnected(false);
                    socketRef.current = null;

                    // Only attempt reconnection if the component is still mounted
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        if (isMountedRef.current) {
                            console.log('Attempting to reconnect...');
                            setupWebSocket();
                        }
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                if (isMountedRef.current) {
                    console.log('WebSocket Error:', error);
                }
            };

            socketRef.current = ws;
            return ws;
        } catch (error) {
            if (isMountedRef.current) {
                console.error('Error creating WebSocket:', error);
            }
            return null;
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        
        // Small delay to avoid the initial strict mode unmount/remount cycle
        const initTimeout = setTimeout(() => {
            if (isMountedRef.current) {
                setupWebSocket();
            }
        }, 100);

        return () => {
            isMountedRef.current = false;
            clearTimeout(initTimeout);
            
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [setupWebSocket]);

    // Clear any saved preferences when the component mounts
    useEffect(() => {
        localStorage.removeItem('learningPreferences');
    }, []);

    const handleButtonClick = async() => {
        if (!text.trim() || !isConnected || isLoading) return;
        setPendingGoal(text);
        setIsPreferencesOpen(true);
        setText(""); // Clear the input after opening the modal
    };

    const handleSaveRoadmap = async () => {
        if (!roadmapData) return;

        try {
            // Convert the roadmapData to match the WebSocket response format exactly
            const mapData = {
                tasks: Object.values(roadmapData).map(task => ({
                    id: task.id,
                    name_of_the_task: task.name_of_the_task,
                    description: task.description,
                    dependencies: task.dependencies.length > 0 ? task.dependencies : "",
                    estimated_duration: task.estimated_duration
                }))
            };

            // Create the roadmap with the properly formatted map data
            const result = await client.models.roadmap.create({
                map: JSON.stringify(mapData)
            });

            if (result.errors) {
                console.error('Error saving roadmap:', result.errors);
                alert('Error saving roadmap. Please try again.');
                return;
            }

            alert('Roadmap saved successfully!');
        } catch (error) {
            console.error('Error saving roadmap:', error);
            alert('Error saving roadmap. Please try again.');
        }
    };

    const handleSendPreferencesRequest = async (preferences: any) => {
        if (!socketRef.current || !isConnected || isLoading) return;
        setIsLoading(true);
        console.log("Input Text:", pendingGoal);

        try {
            console.log('Attempting to connect to server at http://localhost:1865/message');
            // Make API call instead of WebSocket
            const response = await fetch('http://localhost:1865/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: pendingGoal,
                    preferences: preferences
                })
            }).catch(error => {
                console.error('Network error:', error);
                throw new Error(`Failed to connect to server: ${error.message}`);
            });

            if (!response) {
                throw new Error('No response received from server');
            }

            console.log('Server response status:', response.status);
            const rawData = await response.text();
            console.log('Raw response:', rawData);

            let data;
            try {
                data = JSON.parse(rawData);
                console.log('Parsed response data:', data);
            } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            // Extract the tasks data from either content or text field
            let tasksData;
            if (data.content) {
                try {
                    tasksData = JSON.parse(data.content);
                } catch (e) {
                    console.error('Error parsing content:', e);
                }
            }
            if (!tasksData && data.text) {
                try {
                    tasksData = JSON.parse(data.text);
                } catch (e) {
                    console.error('Error parsing text:', e);
                }
            }

            console.log('Extracted tasks data:', tasksData);

            // The response should now have the tasks array
            if (tasksData && tasksData.tasks && Array.isArray(tasksData.tasks)) {
                const taskData: TasksData = {};
                
                // Process each task
                tasksData.tasks.forEach((task: any) => {
                    // Handle dependencies that could be string, empty string, number, or array
                    let dependencies: number[] = [];
                    if (task.dependencies) {
                        if (typeof task.dependencies === 'string') {
                            if (task.dependencies !== "") {
                                // If it's a non-empty string, try to parse it or convert to number
                                try {
                                    const parsed = JSON.parse(task.dependencies);
                                    dependencies = Array.isArray(parsed) ? parsed : [Number(parsed)];
                                } catch (e) {
                                    // If parsing fails, try to convert to number
                                    const num = Number(task.dependencies);
                                    if (!isNaN(num)) {
                                        dependencies = [num];
                                    }
                                }
                            }
                        } else if (typeof task.dependencies === 'number') {
                            dependencies = [task.dependencies];
                        } else if (Array.isArray(task.dependencies)) {
                            dependencies = task.dependencies;
                        }
                    }

                    taskData[task.id.toString()] = {
                        id: task.id,
                        name_of_the_task: task.name_of_the_task,
                        description: task.description,
                        dependencies: dependencies,
                        estimated_duration: task.estimated_duration
                    };
                });

                console.log('Created task data with dependencies:', taskData);
                setRoadmapData(taskData);
                setIsLoading(false);
                setPendingGoal("");
            } else {
                console.error('Invalid data structure received:', tasksData);
                throw new Error('Invalid response format: missing tasks array');
            }
        } catch (error) {
            console.error('Error making API request:', error);
            setIsLoading(false);
            
            // Fallback to WebSocket if API fails
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                const message = {
                    "action": "startTask",
                    "body": JSON.stringify({
                        message: pendingGoal,
                        preferences: preferences
                    })
                };
                
                try {
                    socketRef.current.onmessage = (event) => {
                        try {
                            console.log('Raw WebSocket response:', event.data);  // Log raw response
                            const data = JSON.parse(event.data);
                            console.log('Parsed WebSocket message:', data);

                            if (data.status === "processing" && data.message === "Task started!") {
                                console.log('Task started, waiting for results...');
                                return;
                            }

                            if (data.status === "complete" && data.result) {
                                const result = data.result;
                                console.log("Result: ", result.text);
                                
                                if (!result?.text) {
                                    console.log('No result text in response');
                                    setIsLoading(false);
                                    return;
                                }

                                try {
                                    // Check if the response is an error message
                                    if (typeof result.text === 'string' && 
                                        (result.text.includes("cannot assist") || 
                                         result.text.includes("I'm sorry") || 
                                         result.text.includes("error processing"))) {
                                        console.log('Received error message from server:', result.text);
                                        alert("Error: " + result.text);
                                        setIsLoading(false);
                                        return;
                                    }

                                    // Handle the response text
                                    let parsedText;
                                    if (typeof result.text === 'string') {
                                        try {
                                            // Try to parse as JSON first
                                            parsedText = JSON.parse(result.text);
                                        } catch (parseError) {
                                            console.error('Error parsing result.text as JSON:', parseError);
                                            // If parsing fails, check if it's a valid error message
                                            if (result.text.includes("error") || result.text.includes("sorry")) {
                                                alert("Error: " + result.text);
                                                setIsLoading(false);
                                                return;
                                            }
                                            // If not an error message, create a single task with the text as description
                                            parsedText = {
                                                tasks: [{
                                                    name_of_the_task: "Learning Task",
                                                    id: 1,
                                                    description: result.text,
                                                    dependencies: [],
                                                    estimated_duration: 120
                                                }]
                                            };
                                        }
                                    } else {
                                        parsedText = result.text;
                                    }

                                    console.log('Processed result text:', parsedText);

                                    if (parsedText && parsedText.tasks && Array.isArray(parsedText.tasks)) {
                                        const taskData: TasksData = {};
                                        
                                        // Create tasks with their dependencies from the response
                                        parsedText.tasks.forEach((task: any, index: number) => {
                                            const taskId = (task && typeof task.id !== 'undefined' ? task.id : index + 1).toString();
                                            
                                            // Convert dependencies to array
                                            let dependencies: number[] = [];
                                            if (task.dependencies) {
                                                if (typeof task.dependencies === 'number') {
                                                    // If it's a number, create a single-element array
                                                    dependencies = [task.dependencies];
                                                } else if (Array.isArray(task.dependencies)) {
                                                    // If it's already an array, use it
                                                    dependencies = task.dependencies;
                                                }
                                            }

                                            taskData[taskId] = {
                                                name_of_the_task: task.name_of_the_task || 'Unnamed Task',
                                                id: parseInt(taskId),
                                                description: task.description || 'No description available',
                                                dependencies: dependencies,
                                                estimated_duration: task.estimated_duration || 0
                                            };
                                        });

                                        console.log('Created task data with dependencies:', taskData);
                                        setRoadmapData(taskData);
                                    } else {
                                        console.error('Invalid tasks data structure:', parsedText);
                                        alert("Error: Invalid response format from server");
                                    }
                                } catch (error) {
                                    console.error('Error processing result data:', error);
                                    alert("Error processing server response");
                                } finally {
                                    setIsLoading(false);
                                    setPendingGoal("");
                                }
                            }
                        } catch (error) {
                            console.error('Error parsing WebSocket message:', error);
                            setIsLoading(false);
                        }
                    };

                    socketRef.current.send(JSON.stringify(message));
                } catch (error) {
                    console.error('Error sending WebSocket request:', error);
                    setIsLoading(false);
                }
            } else {
                console.error('Neither API nor WebSocket available');
                alert("Error: Could not connect to the server");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <Title text="Learning Assistant" size="lg" />
                <div className="flex gap-4">
                    {roadmapData && (
                        <button
                            onClick={handleSaveRoadmap}
                            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                            Save Roadmap
                        </button>
                    )}
                </div>
            </div>

            <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full mb-20">
                <div>
                    <WelcomeMessage />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">                    
                    <div className="space-y-8">
                        {isLoading ? (
                            <div className="mt-8 text-center">
                                <p className="text-gray-600">Generating roadmap...</p>
                            </div>
                        ) : roadmapData ? (
                            <div className="mt-8">
                                <DynamicRoadmap tasksData={roadmapData} />
                            </div>
                        ) : (
                            <div className="mt-8 text-center">
                                <p className="text-gray-600">Enter your goal to generate a roadmap</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Fixed bottom input bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
                <div className="max-w-4xl mx-auto p-4 flex items-center gap-4">
                    <div className="flex-1">
                        <TextInput 
                            value={text} 
                            onChange={setText}
                            placeholder="Enter your goal here..."
                        />
                    </div>
                    <Button
                        label={!isConnected ? "Connecting..." : isLoading ? "Processing..." : "Send request"}
                        onClick={handleButtonClick}
                        disabled={!isConnected || isLoading || !text.trim()}
                    />
                </div>
            </div>

            <PreferencesSettingPage
                isOpen={isPreferencesOpen}
                onClose={() => {
                    setIsPreferencesOpen(false);
                    setPendingGoal(""); // Clear pending goal if modal is closed
                }}
                onSendRequest={handleSendPreferencesRequest}
            />
        </div>
    );
}

export default Home;
