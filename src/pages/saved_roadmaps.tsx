import React, { useState, useEffect } from 'react';
import Title from "../components/title";
import DynamicRoadmap from "../components/roadmap";

interface SavedRoadmap {
    id: string;
    title: string;
    date: string;
    tasksData: any;
}

const SavedRoadmaps: React.FC = () => {
    const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('savedRoadmaps');
        if (saved) {
            setSavedRoadmaps(JSON.parse(saved));
        }
    }, []);

    const handleEditTitle = (roadmap: SavedRoadmap) => {
        setEditingId(roadmap.id);
        setNewTitle(roadmap.title);
    };

    const handleSaveTitle = () => {
        if (!editingId || !newTitle.trim()) return;

        const updatedRoadmaps = savedRoadmaps.map(roadmap => {
            if (roadmap.id === editingId) {
                return { ...roadmap, title: newTitle.trim() };
            }
            return roadmap;
        });

        setSavedRoadmaps(updatedRoadmaps);
        localStorage.setItem('savedRoadmaps', JSON.stringify(updatedRoadmaps));
        setEditingId(null);
        setNewTitle('');
    };

    const handleDeleteRoadmap = (id: string) => {
        if (window.confirm('Are you sure you want to delete this roadmap?')) {
            const updatedRoadmaps = savedRoadmaps.filter(roadmap => roadmap.id !== id);
            setSavedRoadmaps(updatedRoadmaps);
            localStorage.setItem('savedRoadmaps', JSON.stringify(updatedRoadmaps));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <Title text="Saved Roadmaps" size="lg" />
                
                <div className="mt-8 grid gap-6">
                    {savedRoadmaps.map((roadmap) => (
                        <div key={roadmap.id} className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                {editingId === roadmap.id ? (
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            className="px-3 py-1 border rounded-md"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSaveTitle}
                                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setNewTitle('');
                                            }}
                                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-semibold text-gray-800">{roadmap.title}</h2>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditTitle(roadmap)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            >
                                                Edit Title
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoadmap(roadmap.id)}
                                                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                                <span className="text-gray-500">{roadmap.date}</span>
                            </div>
                            <DynamicRoadmap tasksData={roadmap.tasksData} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SavedRoadmaps; 