const express = require('express');
const router = express.Router();
const Instructor = require('../models/Instructor');

// Get all instructors for a page
router.get('/:page', async (req, res) => {
  try {
    console.log(`[Server] Getting instructors for ${req.params.page}`);
    const instructors = await Instructor.find({ page: req.params.page });
    console.log(`[Server] Found ${instructors.length} instructors for ${req.params.page}`);
    res.json({ instructors });
  } catch (err) {
    console.error(`[Server] Error fetching instructors for ${req.params.page}:`, err);
    res.status(500).send('Error fetching instructors: ' + err.message);
  }
});

// Add a new instructor
router.post('/:page', async (req, res) => {
  try {
    // Only admins can add instructors
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    console.log(`[Server] Adding new instructor for ${req.params.page}:`, req.body);
    
    if (!req.body.name) {
      return res.status(400).send('Instructor name is required');
    }
    
    // Create new instructor
    const newInstructor = new Instructor({
      name: req.body.name,
      status: req.body.status || 'Available',
      page: req.params.page
    });
    
    // Save the instructor
    await newInstructor.save();
    console.log(`[Server] Saved instructor ${newInstructor.name} with ID ${newInstructor._id}`);
    
    res.status(201).json({
      instructor: newInstructor,
      message: 'Instructor added successfully'
    });
  } catch (err) {
    console.error(`[Server] Error adding instructor for ${req.params.page}:`, err);
    res.status(500).send('Error adding instructor: ' + err.message);
  }
});

// Update instructor status
router.put('/:page/:instructorId', async (req, res) => {
  try {
    // Only admins can update instructors
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    console.log(`[Server] Updating instructor ${req.params.instructorId} status to ${req.body.status}`);
    
    if (!req.body.status) {
      return res.status(400).send('Status is required');
    }
    
    // Validate that the status is either "Available" or "Full"
    const newStatus = req.body.status;
    if (newStatus !== 'Available' && newStatus !== 'Full') {
      return res.status(400).send(`Invalid status value: ${newStatus}. Must be "Available" or "Full"`);
    }
    
    // First, find the instructor to verify it exists and belongs to the correct page
    const instructor = await Instructor.findById(req.params.instructorId);
    
    if (!instructor) {
      console.log(`[Server] Instructor with ID ${req.params.instructorId} not found`);
      return res.status(404).send('Instructor not found');
    }
    
    if (instructor.page !== req.params.page) {
      console.log(`[Server] Instructor ${req.params.instructorId} belongs to page ${instructor.page}, not ${req.params.page}`);
      return res.status(400).send('Instructor does not belong to this page');
    }
    
    console.log(`[Server] Found instructor: ${instructor.name}, current status: ${instructor.status}`);
    
    // Update the instructor status
    instructor.status = newStatus;
    await instructor.save();
    
    console.log(`[Server] Updated instructor ${instructor.name} status to ${instructor.status}`);
    
    // Verify the update by fetching again
    const updatedInstructor = await Instructor.findById(req.params.instructorId);
    console.log(`[Server] Verification - instructor ${updatedInstructor.name} status is now ${updatedInstructor.status}`);
    
    res.json({
      instructor: updatedInstructor,
      message: 'Instructor status updated successfully'
    });
  } catch (err) {
    console.error(`[Server] Error updating instructor:`, err);
    res.status(500).send('Error updating instructor: ' + err.message);
  }
});

// Delete an instructor
router.delete('/:page/:instructorId', async (req, res) => {
  try {
    // Only admins can delete instructors
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    // Find and delete the instructor
    const deletedInstructor = await Instructor.findByIdAndDelete(req.params.instructorId);
    
    if (!deletedInstructor) {
      return res.status(404).send('Instructor not found');
    }
    
    console.log(`[Server] Removed instructor ${deletedInstructor.name}`);
    
    res.json({ message: 'Instructor removed successfully' });
  } catch (err) {
    console.error(`[Server] Error removing instructor:`, err);
    res.status(500).send('Error removing instructor: ' + err.message);
  }
});

module.exports = router; 