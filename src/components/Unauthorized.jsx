const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-lg text-gray-700">
          You are not authorized to access this portal.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;
