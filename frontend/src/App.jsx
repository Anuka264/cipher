import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import Discover from './pages/Discover';
import ConnectionsPage from './pages/ConnectionsPage';
import MessagesPage from './pages/MessagesPage';
import CrewsPage from './pages/CrewsPage';
import CrewSpaceLayout from './pages/CrewSpaceLayout';
import CrewOverviewPage from './pages/CrewOverviewPage';
import CrewTasksPage from './pages/CrewTasksPage';
import CrewEventsPage from './pages/CrewEventsPage';
import CrewMilestonesPage from './pages/CrewMilestonesPage';
import CrewHistoryPage from './pages/CrewHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

const App = () => (
    <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
            element={(
                <ProtectedRoute>
                    <AppLayout />
                </ProtectedRoute>
            )}
        >
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/crews" element={<CrewsPage />} />
            <Route path="/crews/:crewId" element={<CrewSpaceLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<CrewOverviewPage />} />
                <Route path="tasks" element={<CrewTasksPage />} />
                <Route path="events" element={<CrewEventsPage />} />
                <Route path="milestones" element={<CrewMilestonesPage />} />
                <Route path="history" element={<CrewHistoryPage />} />
            </Route>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
);

export default App;
