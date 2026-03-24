import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

const SidebarToggle = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    document.querySelector('.sidebar').classList.toggle('open');
  };

  return (
    <button className="sidebar-toggle" onClick={toggleSidebar}>
      {isOpen ? <FaTimes /> : <FaBars />}
    </button>
  );
};

export default SidebarToggle;