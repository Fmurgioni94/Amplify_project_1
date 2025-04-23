import { useState, useEffect, useCallback, useRef } from "react";
import Title from "../components/title.tsx";
import Button from "../components/button.tsx";
import DynamicRoadmap from "../components/roadmap.tsx";
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../amplify/data/resource';
import { addHours, format } from 'date-fns';

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

// Add these interfaces at the top with the other interfaces
interface TaskAssignment {
    task_id: string;
    start_time: number;
    task_name: string;
    duration: number;
    dependencies: string[];
}

interface StudentAssignment {
    [key: string]: TaskAssignment;
}

interface AssignmentData {
    [student: string]: StudentAssignment;
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

interface GanttChartProps {
    data: AssignmentData;
}

const GanttChart: React.FC<GanttChartProps> = ({ data }) => {
    // Calculate the total duration and earliest start time
    const calculateTimeRange = () => {
        let maxEndTime = 0;
        let minStartTime = Infinity;
        
        Object.values(data).forEach(student => {
            Object.values(student).forEach(task => {
                const endTime = task.start_time + task.duration;
                maxEndTime = Math.max(maxEndTime, endTime);
                minStartTime = Math.min(minStartTime, task.start_time);
            });
        });
        
        return {
            totalDuration: Math.ceil(maxEndTime),
            minStartTime: Math.floor(minStartTime)
        };
    };

    const { totalDuration, minStartTime } = calculateTimeRange();
    const hourWidth = 60; // Width in pixels for each hour
    
    // Create hour markers for the timeline
    const hourMarkers = Array.from({ length: totalDuration + 1 }, (_, i) => i + minStartTime);

    const getPositionStyle = (startTime: number, duration: number) => {
        const left = (startTime - minStartTime) * hourWidth;
        const width = duration * hourWidth;
        
        return {
            left: `${left}px`,
            width: `${width}px`
        };
    };

    return (
        <div className="overflow-x-auto">
            <div style={{ 
                minWidth: `${(totalDuration + 1) * hourWidth + 200}px`,
                paddingBottom: '20px'
            }}>
                {/* Timeline header */}
                <div className="flex border-b mb-2 sticky top-0 bg-white">
                    <div className="w-48 flex-shrink-0 font-medium p-2">Student</div>
                    <div className="flex-grow flex" style={{ marginLeft: '-1px' }}>
                        {hourMarkers.map((hour) => (
                            <div 
                                key={hour} 
                                className="flex-shrink-0 text-xs text-center border-l"
                                style={{ width: `${hourWidth}px` }}
                            >
                                Hour {hour}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tasks */}
                {Object.entries(data).map(([student, tasks]) => (
                    <div key={student} className="flex mb-4 hover:bg-gray-50">
                        <div className="w-48 flex-shrink-0 font-medium p-2">{student}</div>
                        <div className="flex-grow relative" style={{ height: '40px' }}>
                            {Object.values(tasks).map((task) => {
                                const posStyle = getPositionStyle(task.start_time, task.duration);
                                return (
                                    <div
                                        key={task.task_id}
                                        className="absolute h-8 rounded shadow-sm transition-opacity hover:opacity-90"
                                        style={{
                                            ...posStyle,
                                            backgroundColor: `hsl(${parseInt(task.task_id.slice(1)) * 37 % 360}, 70%, 80%)`,
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            top: '4px',
                                        }}
                                        title={`${task.task_name}
Start: Hour ${task.start_time.toFixed(1)}
Duration: ${task.duration} hours
Dependencies: ${task.dependencies.join(', ') || 'None'}`}
                                    >
                                        <div className="text-xs truncate px-2" style={{ lineHeight: '30px' }}>
                                            {task.task_name}
                                        </div>
                                    </div>
                                );
                            })}
                            {/* Grid lines */}
                            <div className="absolute inset-0 grid" style={{
                                gridTemplateColumns: `repeat(${totalDuration + 1}, ${hourWidth}px)`,
                                pointerEvents: 'none'
                            }}>
                                {hourMarkers.map(hour => (
                                    <div key={hour} className="border-l border-gray-200"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Legend */}
            <div className="mt-4 text-xs text-gray-600">
                * Hover over tasks to see full details including start time, duration, and dependencies
            </div>
        </div>
    );
};

function CourseworkOrganiser() {
    const [selectedCoursework, setSelectedCoursework] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [roadmapData, setRoadmapData] = useState<TasksData | null>(null);
    const [studentAssignments, setStudentAssignments] = useState<StudentTasks | null>(null);
    const [numberOfStudents, setNumberOfStudents] = useState<number>(0);
    const [studentSkills, setStudentSkills] = useState<StudentSkill[]>([]);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState("");
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);

    const handleGenerateRoadmap = async () => {
        if (!selectedCoursework || isLoading) return;
        setIsLoading(true);

        try {
            console.log('Attempting to connect to server');
            const response = await fetch('http://localhost:1865/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: "run the algorithm"
                })
            }).catch(error => {
                console.error('Network error:', error);
                throw new Error(`Failed to connect to server: ${error.message}`);
            });

            if (!response) {
                throw new Error('No response received from server');
            }

            const rawData = await response.text();
            console.log('Raw response data:', rawData);

            let data;
            try {
                data = JSON.parse(rawData);
                if (data.content) {
                    data = JSON.parse(data.content);
                } else if (data.text) {
                    data = JSON.parse(data.text);
                }
                console.log('Parsed assignment data:', data);
                setAssignmentData(data);
            } catch (error) {
                console.error('Error parsing response:', error);
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Error making API request:', error);
            alert('Failed to generate schedule. Please try again.');
        } finally {
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

            <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full mb-20">
                <div className="space-y-8">
                    {/* Student Management Section */}
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
                                    label={isLoading ? "Generating schedule..." : "Generate schedule"}
                                    onClick={handleGenerateRoadmap}
                                    disabled={isLoading || !selectedCoursework || numberOfStudents === 0}
                                />
                            </div>
                        )}

                        {studentAssignments && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800">Student Task Assignments</h2>
                                <StudentAssignmentsTable assignments={studentAssignments} />
                            </div>
                        )}
                    </div>

                    {/* Gantt Chart Section */}
                    {assignmentData && (
                        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800">Task Assignment Schedule</h2>
                            <GanttChart data={assignmentData} />
                        </div>
                    )}
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
