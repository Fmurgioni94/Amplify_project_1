import React, { useState } from 'react';
import Title from "../components/title";
import Modal from "../components/Modal";

interface LearningPreferences {
    learningStyle: 'practical' | 'theoretical';
    preferredComplexity: 'basic' | 'intermediate' | 'advanced';
    motivation: 'low' | 'medium' | 'high';
    priorExperience: 'none' | 'beginner' | 'intermediate' | 'advanced';
    additionalNotes: string;
}

interface PreferencesSettingPageProps {
    isOpen: boolean;
    onClose: () => void;
    onSendRequest: (preferences: LearningPreferences) => void;
}

const PreferencesSettingPage: React.FC<PreferencesSettingPageProps> = ({ isOpen, onClose, onSendRequest }) => {
    const [preferences, setPreferences] = useState<LearningPreferences>({
        learningStyle: 'practical',
        preferredComplexity: 'intermediate',
        motivation: 'medium',
        priorExperience: 'beginner',
        additionalNotes: '',
    });

    const handlePreferencesChange = (updates: Partial<LearningPreferences>) => {
        setPreferences(prev => ({ ...prev, ...updates }));
    };

    const handleSendRequest = () => {
        onSendRequest(preferences);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="space-y-8">
                <Title text="Learning Preferences" size="lg" />
                
                <div className="space-y-8">
                    {/* Learning Style */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Learning Style</h2>
                        <div className="flex gap-4">
                            {['practical', 'theoretical'].map((style) => (
                                <button
                                    key={style}
                                    onClick={() => handlePreferencesChange({ learningStyle: style as any })}
                                    className={`px-4 py-2 rounded-md ${
                                        preferences.learningStyle === style
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {style.charAt(0).toUpperCase() + style.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preferred Complexity */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Preferred Complexity</h2>
                        <div className="flex gap-4">
                            {['basic', 'intermediate', 'advanced'].map((complexity) => (
                                <button
                                    key={complexity}
                                    onClick={() => handlePreferencesChange({ preferredComplexity: complexity as any })}
                                    className={`px-4 py-2 rounded-md ${
                                        preferences.preferredComplexity === complexity
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Motivation Level */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Motivation Level</h2>
                        <div className="flex gap-4">
                            {['low', 'medium', 'high'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => handlePreferencesChange({ motivation: level as any })}
                                    className={`px-4 py-2 rounded-md ${
                                        preferences.motivation === level
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prior Experience */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Prior Experience</h2>
                        <div className="flex gap-4">
                            {['none', 'beginner', 'intermediate', 'advanced'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => handlePreferencesChange({ priorExperience: level as any })}
                                    className={`px-4 py-2 rounded-md ${
                                        preferences.priorExperience === level
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Additional Notes</h2>
                        <textarea
                            value={preferences.additionalNotes}
                            onChange={(e) => handlePreferencesChange({ additionalNotes: e.target.value })}
                            className="w-full h-32 form-textarea rounded-md border-gray-300 shadow-sm"
                            placeholder="Add any additional notes or specific requirements..."
                        />
                    </div>

                    {/* Send Request Button */}
                    <div className="pt-6">
                        <button
                            onClick={handleSendRequest}
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Send Request
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PreferencesSettingPage;
