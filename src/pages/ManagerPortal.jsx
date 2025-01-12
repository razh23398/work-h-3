import React, { useState, useEffect } from 'react';
    import Calendar from 'react-calendar';
    import 'react-calendar/dist/Calendar.css';
    import './ManagerPortal.css';
    import { db } from '../firebase';
    import {
      collection,
      addDoc,
      onSnapshot,
      doc,
      updateDoc,
      deleteDoc,
    } from 'firebase/firestore';

    function ManagerPortal() {
      const [date, setDate] = useState(new Date());
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [selectedDate, setSelectedDate] = useState(null);
      const [shiftType, setShiftType] = useState('');
      const [employeesNeeded, setEmployeesNeeded] = useState('');
      const [employees, setEmployees] = useState([]);
      const [newEmployee, setNewEmployee] = useState({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
      });
      const [shifts, setShifts] = useState([]);
      const [assignedEmployees, setAssignedEmployees] = useState([]);
      const [mockEmployees] = useState([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Alice Brown' },
      ]);
      const restaurantId = sessionStorage.getItem('restaurantId');

      useEffect(() => {
        if (restaurantId) {
          const shiftsRef = collection(
            db,
            'restaurants',
            restaurantId,
            'shifts'
          );
          const unsubscribeShifts = onSnapshot(shiftsRef, (snapshot) => {
            const shiftsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setShifts(shiftsData);
          });

          const employeesRef = collection(
            db,
            'restaurants',
            restaurantId,
            'employees'
          );
          const unsubscribeEmployees = onSnapshot(employeesRef, (snapshot) => {
            const employeesData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setEmployees(employeesData);
          });

          return () => {
            unsubscribeShifts();
            unsubscribeEmployees();
          };
        }
      }, [restaurantId]);

      const handleDateChange = (date) => {
        setDate(date);
        setSelectedDate(date);
        setIsModalOpen(true);
      };

      const openModal = (date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
      };

      const closeModal = () => {
        setIsModalOpen(false);
        setShiftType('');
        setEmployeesNeeded('');
        setAssignedEmployees([]);
      };

      const handleAddShift = async () => {
        if (selectedDate && shiftType && employeesNeeded) {
          const shiftsRef = collection(
            db,
            'restaurants',
            restaurantId,
            'shifts'
          );
          try {
            await addDoc(shiftsRef, {
              date: selectedDate.toLocaleDateString(),
              shiftType: shiftType,
              neededEmployees: parseInt(employeesNeeded, 10),
              assignedEmployees: assignedEmployees,
            });
            closeModal();
          } catch (error) {
            console.error('Error adding shift:', error);
          }
        }
      };

      const handleAddEmployee = async () => {
        if (
          newEmployee.firstName &&
          newEmployee.lastName &&
          newEmployee.username &&
          newEmployee.password
        ) {
          const employeesRef = collection(
            db,
            'restaurants',
            restaurantId,
            'employees'
          );
          try {
            await addDoc(employeesRef, newEmployee);
            setNewEmployee({
              firstName: '',
              lastName: '',
              username: '',
              password: '',
            });
          } catch (error) {
            console.error('Error adding employee:', error);
          }
        }
      };

      const handleAssignEmployee = (employeeId) => {
        if (!assignedEmployees.includes(employeeId)) {
          setAssignedEmployees([...assignedEmployees, employeeId]);
        }
      };

      const handleUnassignEmployee = (employeeId) => {
        setAssignedEmployees(assignedEmployees.filter((id) => id !== employeeId));
      };

      const handleUpdateShift = async () => {
        if (selectedDate && shiftType && employeesNeeded) {
          const shiftsRef = collection(
            db,
            'restaurants',
            restaurantId,
            'shifts'
          );
          const shiftToUpdate = shifts.find(
            (shift) => shift.date === selectedDate.toLocaleDateString()
          );
          if (shiftToUpdate) {
            const shiftDocRef = doc(shiftsRef, shiftToUpdate.id);
            try {
              await updateDoc(shiftDocRef, {
                date: selectedDate.toLocaleDateString(),
                shiftType: shiftType,
                neededEmployees: parseInt(employeesNeeded, 10),
                assignedEmployees: assignedEmployees,
              });
              closeModal();
            } catch (error) {
              console.error('Error updating shift:', error);
            }
          } else {
            handleAddShift();
          }
        }
      };

      const isDateAssigned = (date) => {
        return shifts.some((shift) => shift.date === date.toLocaleDateString());
      };

      const tileClassName = ({ date, view }) => {
        if (view === 'month' && isDateAssigned(date)) {
          return 'assigned-shift';
        }
        return null;
      };

      return (
        <div className="manager-portal">
          <h1>Manager Portal</h1>
          <div className="calendar-container">
            <Calendar
              onChange={handleDateChange}
              value={date}
              onClickDay={(value) => openModal(value)}
              tileClassName={tileClassName}
            />
          </div>

          {isModalOpen && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={closeModal}>
                  &times;
                </span>
                <h2>Add Shift for {selectedDate?.toLocaleDateString()}</h2>
                <div className="form-group">
                  <label>Shift Type:</label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                  >
                    <option value="">Select Shift</option>
                    <option value="day">Day</option>
                    <option value="lunch">Lunch</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Employees Needed:</label>
                  <input
                    type="number"
                    value={employeesNeeded}
                    onChange={(e) => setEmployeesNeeded(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <h3>Assign Employees</h3>
                  <div className="employee-list">
                    {mockEmployees.map((employee) => (
                      <div key={employee.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={assignedEmployees.includes(employee.id)}
                            onChange={(e) =>
                              e.target.checked
                                ? handleAssignEmployee(employee.id)
                                : handleUnassignEmployee(employee.id)
                            }
                          />
                          {employee.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={handleUpdateShift}>Save</button>
              </div>
            </div>
          )}

          <div className="employee-management">
            <h2>Employee Management</h2>
            <table className="employee-table">
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Username</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.firstName}</td>
                    <td>{employee.lastName}</td>
                    <td>{employee.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="add-employee-form">
              <h3>Add New Employee</h3>
              <input
                type="text"
                placeholder="First Name"
                value={newEmployee.firstName}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, firstName: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newEmployee.lastName}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, lastName: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Username"
                value={newEmployee.username}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, username: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Password"
                value={newEmployee.password}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, password: e.target.value })
                }
              />
              <button onClick={handleAddEmployee}>Add Employee</button>
            </div>
          </div>
        </div>
      );
    }

    export default ManagerPortal;
