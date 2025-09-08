import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="text-xl font-bold">AI SaaS</a>
        <div>
          <a href="/dashboard" className="mr-4">Dashboard</a>
          <a href="/profile" className="mr-4">Profile</a>
          <a href="/login">Login</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

