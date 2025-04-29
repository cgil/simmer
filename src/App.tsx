import { FC } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SpeedInsights } from '@vercel/speed-insights/react';
import theme from './theme/theme';
import RecipePage from './pages/recipe/RecipePage';
import NewRecipePage from './pages/recipe/NewRecipePage';
import EditRecipePage from './pages/recipe/EditRecipePage';
import CookingModePage from './pages/recipe/cooking/CookingModePage';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRecipeRoute from './components/auth/PublicRecipeRoute';
import PublicCollectionRoute from './components/auth/PublicCollectionRoute';
import { AuthProvider } from './context/AuthContext';
import { ALL_RECIPES_ID, COLLECTION_ROUTE_PATH } from './types/collection';

const App: FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Auth Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route
                            path="/auth/callback"
                            element={<AuthCallbackPage />}
                        />

                        {/* Protected Routes */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Navigate
                                        to={`${COLLECTION_ROUTE_PATH}/${ALL_RECIPES_ID}`}
                                        replace
                                    />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/collection/:collectionId"
                            element={<PublicCollectionRoute />}
                        />
                        <Route
                            path="/recipe/new"
                            element={
                                <ProtectedRoute>
                                    <NewRecipePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/recipe/edit"
                            element={
                                <ProtectedRoute>
                                    <EditRecipePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/recipe/:id"
                            element={
                                <PublicRecipeRoute>
                                    <RecipePage />
                                </PublicRecipeRoute>
                            }
                        />
                        <Route
                            path="/recipe/:id/cook"
                            element={
                                <PublicRecipeRoute>
                                    <CookingModePage />
                                </PublicRecipeRoute>
                            }
                        />

                        {/* Fallback Route */}
                        <Route
                            path="*"
                            element={
                                <Navigate
                                    to={`${COLLECTION_ROUTE_PATH}/${ALL_RECIPES_ID}`}
                                    replace
                                />
                            }
                        />
                    </Routes>
                </Router>
            </AuthProvider>
            <SpeedInsights debug={false} />
        </ThemeProvider>
    );
};

export default App;
