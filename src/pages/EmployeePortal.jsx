import React, { useState, useEffect } from 'react';
    import Calendar from 'react-calendar';
    import 'react-calendar/dist/Calendar.css';
    import './EmployeePortal.css';
    import { db } from '../firebase';
    import {
      collection,
      onSnapshot,
      doc,
      updateDoc,
      arrayUnion,
    } from 'firebase/firestore';

    function EmployeePortal() {
      const [date, setDate] = useState(new Date());
      const [selectedDate, setSelectedDate] = useState(null);
      const [shifts, setShifts] = useState([]);
      const [shiftRequest, setShiftRequest] = useState(null);
      const [assignedShifts, setAssignedShifts] = useState([]);
      const restaurantId = sessionStorage.getItem('restaurantId');
      const userRole = sessionStorage.getItem('userRole');
      const [employeeId, setEmployeeId] = useState(null);

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

          const fetchEmployeeId = async () => {
            if (userRole === 'employee') {
              const employeesRef = collection(
                db,
                'restaurants',
                restaurantId,
                'employees'
              );
              const unsubscribeEmployees = onSnapshot(employeesRef, (snapshot) => {
                snapshot.forEach((doc) => {
                  if (doc.data().username === sessionStorage.getItem('username')) {
                    setEmployeeId(doc.id);
                  }
                });
              });
              return () => {
                unsubscribeEmployees();
              };
            }
          };
          fetchEmployeeId();

          return () => {
            unsubscribeShifts();
          };
        }
      }, [restaurantId, userRole]);

      useEffect(() => {
        if (employeeId && shifts) {
          const assigned = shifts
            .filter((shift) => shift.assignedEmployees?.includes(employeeId))
            .map((shift) => shift.date);
          setAssignedShifts(assigned);
        }
      }, [shifts, employeeId]);

      const handleDateChange = (date) => {
        setDate(date);
        setSelectedDate(date);
      };

      const handleRequestShift = async () => {
        if (selectedDate && employeeId) {
          const shiftToUpdate = shifts.find(
            (shift) => shift.date === selectedDate.toLocaleDateString()
          );
          if (shiftToUpdate) {
            const shiftDocRef = doc(
              db,
              'restaurants',
              restaurantId,
              'shifts',
              shiftToUpdate.id
            );
            try {
              await updateDoc(shiftDocRef, {
                requests: arrayUnion(employeeId),
              });
              setShiftRequest(selectedDate);
            } catch (error) {
              console.error('Error requesting shift:', error);
            }
          }
        }
      };

      const isDateAssigned = (date) => {
        return assignedShifts.includes(date.toLocaleDateString());
      };

      const tileClassName = ({ date, view }) => {
        if (view === 'month' && isDateAssigned(date)) {
          return 'assigned-shift';
        }
        return null;
      };

      return (
        <div className="employee-portal">
          <h1>Employee Portal</h1>
          <div className="calendar-container">
            <Calendar
              onChange={handleDateChange}
              value={date}
              onClickDay={(value) => handleDateChange(value)}
              tileClassName={tileClassName}
            />
          </div>

          {selectedDate && (
            <div className="shift-info">
              <h2>
                {isDateAssigned(selectedDate)
                  ? 'Assigned Shift'
                  : 'Open Shift'}
              </h2>
              <p>
                Date: {selectedDate.toLocaleDateString()}
              </p>
              {!isDateAssigned(selectedDate) && (
                <button onClick={handleRequestShift}>Request to Work</button>
              )}
              {shiftRequest && (
                <p>
                  Shift requested for: {shiftRequest.toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="assigned-shifts">
            <h2>Assigned Shifts</h2>
            <ul>
              {assignedShifts.map((shift, index) => (
                <li key={index}>
                  {shift}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    export default EmployeePortal;
