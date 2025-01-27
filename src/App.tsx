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
import CatalogPage from './pages/catalog/CatalogPage';
import RecipePage from './pages/recipe/RecipePage';
import NewRecipePage from './pages/recipe/NewRecipePage';
import EditRecipePage from './pages/recipe/EditRecipePage';

const App: FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/" element={<CatalogPage />} />
                    <Route path="/recipe/new" element={<NewRecipePage />} />
                    <Route path="/recipe/edit" element={<EditRecipePage />} />
                    <Route path="/recipe/:id" element={<RecipePage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
            <SpeedInsights debug={false} />
        </ThemeProvider>
    );
};

export default App;
