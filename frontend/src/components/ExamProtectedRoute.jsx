import { Navigate, Outlet } from 'react-router-dom';

const ExamProtectedRoute = () => {
    // LocalStorage එකේ 'accessToken' එක තිබේදැයි පරීක්ෂා කිරීම
    const token = sessionStorage.getItem('accessToken');

    // Token එක තිබේ නම් අදාළ Exam Component එක (Outlet) පෙන්වයි.
    // නැතිනම් නැවත '/exam-login' පිටුවට යවයි.
    return token ? <Outlet /> : <Navigate to="/exam-login" replace />;
};

export default ExamProtectedRoute;