import { useState, useEffect, useCallback, useRef } from "react";
import Title from "../components/title.tsx";
import Button from "../components/button.tsx";
import DynamicRoadmap from "../components/roadmap.tsx";
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

// Add this interface after the existing interfaces
interface StudentTasks {
    [key: string]: {
        [key: string]: string;
    };
}

// Add these interfaces after the existing ones

// Update the StudentSkill interface to include cognitivePower and availableHours
interface StudentSkill {
    studentId: string;
    name: string;
    cognitivePower: number;
    availableHours: number;
    skills: {
        programming: number;
        writing: number;
        analysis: number;
        testing: number;
        design: number;
        documentation: number;
    };
}

// Sample coursework list - you can replace this with your actual coursework data
const COURSEWORK_LIST = [
    { id: 1, name: "Advance Programming Assignment" },   
];

// Add this component before the main CourseworkOrganiser component
const StudentAssignmentsTable = ({ assignments }: { assignments: StudentTasks }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b">Student</th>
                        {[...Array(10)].map((_, i) => (
                            <th key={i} className="py-2 px-4 border-b">
                                Task {i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(assignments).map(([student, tasks]) => (
                        <tr key={student} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b font-medium">{student}</td>
                            {[...Array(10)].map((_, i) => (
                                <td key={i} className="py-2 px-4 border-b text-center">
                                    {tasks[`task_${i + 1}`]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

function CourseworkOrganiser() {
    const [selectedCoursework, setSelectedCoursework] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [roadmapData, setRoadmapData] = useState<TasksData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number>();
    const isMountedRef = useRef(false);
    const [studentAssignments, setStudentAssignments] = useState<StudentTasks | null>(null);
    const [numberOfStudents, setNumberOfStudents] = useState<number>(0);
    const [studentSkills, setStudentSkills] = useState<StudentSkill[]>([]);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState("");
    const [isLoadingData, setIsLoadingData] = useState(true);

    const setupWebSocket = useCallback(() => {
        if (!isMountedRef.current) return null;

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

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

    const handleGenerateRoadmap = async () => {
        if (!selectedCoursework || !socketRef.current || !isConnected || isLoading) return;
        setIsLoading(true);

        const message = {
            "action": "startTask",
            "body": JSON.stringify({
                message: "run the algorithm",
                numberOfStudents: numberOfStudents,
                studentSkills: studentSkills
            })
        };
        
        // Log the final message string that will be sent to WebSocket
        const messageString = JSON.stringify(message);
        console.log("Raw message to be sent:", messageString);

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
                        if (!result?.text) {
                            console.log('No result text in response');
                            setIsLoading(false);
                            return;
                        }

                        try {
                            if (typeof result.text === 'string' && result.text.includes("cannot assist")) {
                                console.log('Received error message from server:', result.text);
                                alert("Error: " + result.text);
                                setIsLoading(false);
                                return;
                            }

                            const parsedText = JSON.parse(result.text);
                            console.log('Parsed result text:', parsedText);

                            // Check if the response is student assignments
                            if (parsedText && typeof parsedText === 'object' && 'S1' in parsedText) {
                                setStudentAssignments(parsedText);
                                setIsLoading(false);
                                return;
                            }

                            if (parsedText && parsedText.tasks && Array.isArray(parsedText.tasks)) {
                                const taskData: TasksData = {};
                                
                                parsedText.tasks.forEach((task: any, index: number) => {
                                    const taskId = (task && typeof task.id !== 'undefined' ? task.id : index + 1).toString();
                                    taskData[taskId] = {
                                        name_of_the_task: task.name_of_the_task || 'Unnamed Task',
                                        id: parseInt(taskId),
                                        description: task.description || 'No description available',
                                        dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
                                        estimated_duration: task.estimated_duration || 0
                                    };
                                });

                                setRoadmapData(taskData);
                            } else {
                                console.error('Invalid tasks data structure:', parsedText);
                            }
                        } catch (error) {
                            console.error('Error processing result data:', error);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    setIsLoading(false);
                }
            };

            socketRef.current.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error sending request:', error);
            setIsLoading(false);
        }
    };

    const handleSkillChange = (studentId: string, skillName: string, value: number) => {
        setStudentSkills(prevSkills => {
            const newSkills = [...prevSkills];
            const studentIndex = newSkills.findIndex(s => s.studentId === studentId);
            
            if (studentIndex !== -1) {
                if (skillName === 'cognitivePower') {
                    newSkills[studentIndex] = {
                        ...newSkills[studentIndex],
                        cognitivePower: value
                    };
                } else if (skillName === 'availableHours') {
                    newSkills[studentIndex] = {
                        ...newSkills[studentIndex],
                        availableHours: value
                    };
                } else {
                    newSkills[studentIndex] = {
                        ...newSkills[studentIndex],
                        skills: {
                            ...newSkills[studentIndex].skills,
                            [skillName]: value
                        }
                    };
                }
            }
            
            return newSkills;
        });
    };

    const addStudent = () => {
        setIsNameModalOpen(true);
    };

    const handleAddStudent = () => {
        if (!newStudentName.trim()) {
            alert("Please enter a name for the student");
            return;
        }
        
        if (numberOfStudents >= 10) return; // Maximum 10 students
        
        setNumberOfStudents(prev => prev + 1);
        setStudentSkills(prevSkills => [
            ...prevSkills,
            {
                studentId: `S${prevSkills.length + 1}`,
                name: newStudentName,
                cognitivePower: 0.7, // Default value
                availableHours: 20, // Default value (20 hours per week)
                skills: {
                    programming: 0.7,
                    writing: 0.7,
                    analysis: 0.7,
                    testing: 0.7,
                    design: 0.7,
                    documentation: 0.7
                }
            }
        ]);
        
        setNewStudentName("");
        setIsNameModalOpen(false);
    };

    const removeStudent = (studentIndex: number) => {
        if (numberOfStudents <= 1) return; // Minimum 1 student
        setNumberOfStudents(prev => prev - 1);
        setStudentSkills(prevSkills => {
            const newSkills = prevSkills.filter((_, index) => index !== studentIndex);
            // Reassign student IDs to maintain sequence
            return newSkills.map((student, index) => ({
                ...student,
                studentId: `S${index + 1}`
            }));
        });
    };

    const handleSaveStudentData = async (student: StudentSkill) => {
        try {
            const existingEntry = await client.models.studentInfo.get({
                id: student.studentId
            });

            let result;
            if (existingEntry.data) {
                result = await client.models.studentInfo.update({
                    id: student.studentId,
                    name: student.name,
                    cognitivePower: parseFloat(student.cognitivePower.toString()),
                    availableHours: parseFloat(student.availableHours.toString()),
                    programming: parseFloat(student.skills.programming.toString()),
                    writing: parseFloat(student.skills.writing.toString()),
                    analysis: parseFloat(student.skills.analysis.toString()),
                    testing: parseFloat(student.skills.testing.toString()),
                    design: parseFloat(student.skills.design.toString()),
                    documentation: parseFloat(student.skills.documentation.toString())
                });
            } else {
                result = await client.models.studentInfo.create({
                    id: student.studentId,
                    name: student.name,
                    cognitivePower: parseFloat(student.cognitivePower.toString()),
                    availableHours: parseFloat(student.availableHours.toString()),
                    programming: parseFloat(student.skills.programming.toString()),
                    writing: parseFloat(student.skills.writing.toString()),
                    analysis: parseFloat(student.skills.analysis.toString()),
                    testing: parseFloat(student.skills.testing.toString()),
                    design: parseFloat(student.skills.design.toString()),
                    documentation: parseFloat(student.skills.documentation.toString())
                });
            }

            if (result.errors) {
                console.error('Errors saving student:', result.errors);
                alert(`Error saving data for ${student.name}`);
                return;
            }

            alert(`Successfully ${existingEntry.data ? 'updated' : 'saved'} data for ${student.name}`);
            console.log(`${existingEntry.data ? 'Updated' : 'Saved'} student data:`, result.data);
        } catch (error) {
            console.error('Error saving student:', error);
            alert(`Error saving data for ${student.name}`);
        }
    };

    const handleDeleteStudentData = async (student: StudentSkill) => {
        try {
            const result = await client.models.studentInfo.delete({
                id: student.studentId
            });

            if (result.errors) {
                console.error('Errors deleting student:', result.errors);
                alert(`Error deleting data for ${student.name}`);
                return;
            }

            alert(`Successfully deleted data for ${student.name}`);
            console.log('Deleted student data:', result.data);
        } catch (error) {
            console.error('Error deleting student:', error);
            alert(`Error deleting data for ${student.name}`);
        }
    };

    // Add this function to fetch student data
    const fetchStudentData = async () => {
        try {
            const { data: students, errors } = await client.models.studentInfo.list();
            
            if (errors) {
                console.error('Error fetching students:', errors);
                return;
            }

            if (students && students.length > 0) {
                const formattedStudents: StudentSkill[] = students.map(student => {
                    // Ensure all required fields are present and non-null
                    const studentId = student.id || `S${Math.random().toString(36).substr(2, 9)}`;
                    const name = student.name || 'Unnamed Student';
                    const cognitivePower = student.cognitivePower ?? 0.7;
                    const availableHours = student.availableHours ?? 20;
                    
                    return {
                        studentId,
                        name,
                        cognitivePower,
                        availableHours,
                        skills: {
                            programming: student.programming ?? 0.7,
                            writing: student.writing ?? 0.7,
                            analysis: student.analysis ?? 0.7,
                            testing: student.testing ?? 0.7,
                            design: student.design ?? 0.7,
                            documentation: student.documentation ?? 0.7
                        }
                    };
                });

                setStudentSkills(formattedStudents);
                setNumberOfStudents(formattedStudents.length);
            }
        } catch (error) {
            console.error('Error fetching student data:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Add this useEffect to load data when component mounts
    useEffect(() => {
        fetchStudentData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <Title text="Coursework Organizer" size="lg" />
            </div>

            <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full mb-20">
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
                    {isLoadingData ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800">Select Your Coursework</h2>
                            <select
                                value={selectedCoursework}
                                onChange={(e) => setSelectedCoursework(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a coursework...</option>
                                {COURSEWORK_LIST.map((coursework) => (
                                    <option key={coursework.id} value={coursework.name}>
                                        {coursework.name}
                                    </option>
                                ))}
                            </select>

                            <div className="space-y-4 mt-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">Students</h3>
                                    <button
                                        onClick={addStudent}
                                        disabled={numberOfStudents >= 10}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        Add Student
                                    </button>
                                </div>
                            </div>

                            {numberOfStudents > 0 && (
                                <div className="space-y-6 mt-6">
                                    <h3 className="text-lg font-semibold text-gray-800">Student Skills Self-Evaluation</h3>
                                    <p className="text-sm text-gray-600">Rate each skill from 0 to 1 (0 = No experience, 1 = Expert)</p>
                                    {studentSkills.map((student, studentIndex) => (
                                        <div key={student.studentId} className="relative space-y-4 p-6 border rounded-lg bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-medium text-lg">{student.name}</h4>
                                                    <p className="text-sm text-gray-500">Student {studentIndex + 1}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeStudent(studentIndex)}
                                                    disabled={numberOfStudents <= 1}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="grid gap-4">
                                                <div key={`${student.studentId}-cognitivePower`} className="space-y-2">
                                                    <label className="flex justify-between">
                                                        <span className="capitalize">Cognitive Power</span>
                                                        <span className="text-gray-500">{Math.round(student.cognitivePower * 100)}%</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.1"
                                                        value={student.cognitivePower}
                                                        onChange={(e) => handleSkillChange(
                                                            student.studentId,
                                                            'cognitivePower',
                                                            parseFloat(e.target.value)
                                                        )}
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div key={`${student.studentId}-availableHours`} className="space-y-2">
                                                    <label className="flex justify-between">
                                                        <span className="capitalize">Available Hours per Week</span>
                                                        <span className="text-gray-500">{student.availableHours} hours</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="40"
                                                        step="1"
                                                        value={student.availableHours}
                                                        onChange={(e) => handleSkillChange(
                                                            student.studentId,
                                                            'availableHours',
                                                            parseFloat(e.target.value)
                                                        )}
                                                        className="w-full"
                                                    />
                                                </div>
                                                {Object.entries(student.skills).map(([skillName, value]) => (
                                                    <div key={`${student.studentId}-${skillName}`} className="space-y-2">
                                                        <label className="flex justify-between">
                                                            <span className="capitalize">{skillName}</span>
                                                            <span className="text-gray-500">{Math.round(value * 100)}%</span>
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.1"
                                                            value={value}
                                                            onChange={(e) => handleSkillChange(
                                                                student.studentId,
                                                                skillName,
                                                                parseFloat(e.target.value)
                                                            )}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-6 flex justify-end space-x-3">
                                                <button
                                                    onClick={() => handleSaveStudentData(student)}
                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStudentData(student)}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <Button
                                label={!isConnected ? "Connecting..." : isLoading ? "Generating schedule..." : "Generate schedule"}
                                onClick={handleGenerateRoadmap}
                                disabled={!isConnected || isLoading || !selectedCoursework || numberOfStudents === 0}
                            />
                        </div>
                    )}

                    {studentAssignments && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800">Student Task Assignments</h2>
                            <StudentAssignmentsTable assignments={studentAssignments} />
                        </div>
                    )}

                    <div className="space-y-8">
                        {roadmapData && <DynamicRoadmap tasksData={roadmapData} />}
                    </div>
                </div>
            </main>

            {isNameModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
                        <input
                            type="text"
                            placeholder="Enter student name"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setNewStudentName("");
                                    setIsNameModalOpen(false);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddStudent}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CourseworkOrganiser;
