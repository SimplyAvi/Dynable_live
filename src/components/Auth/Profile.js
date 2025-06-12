import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import FormInput from '../FormInput';
import './Auth.css';

const Profile = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    // TODO: Get user from Redux store
    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        if (user) {
            setEmail(user.email);
            setName(user.name || '');
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5001/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            // TODO: Clear auth state from Redux
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5001/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email }),
                credentials: 'include',
            });

            if (response.ok) {
                const updatedUser = await response.json();
                // TODO: Update user in Redux store
                setIsEditing(false);
                alert('Profile updated successfully!');
            } else {
                alert('Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            alert('An error occurred while updating profile.');
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Profile</h2>
                {isEditing ? (
                    <form onSubmit={handleUpdateProfile}>
                        <FormInput
                            type="text"
                            value={name}
                            handleChange={(e) => setName(e.target.value)}
                            label="Name"
                        />
                        <FormInput
                            type="email"
                            value={email}
                            handleChange={(e) => setEmail(e.target.value)}
                            label="Email"
                        />
                        <div className="profile-buttons">
                            <button type="submit" className="auth-button">
                                Save Changes
                            </button>
                            <button
                                type="button"
                                className="auth-button secondary"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-info">
                        <p><strong>Name:</strong> {name}</p>
                        <p><strong>Email:</strong> {email}</p>
                        <div className="profile-buttons">
                            <button
                                className="auth-button"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </button>
                            <button
                                className="auth-button secondary"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile; 