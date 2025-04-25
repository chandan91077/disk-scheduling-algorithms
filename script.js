document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    const html = document.documentElement;
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    html.classList.add(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });
    
    themeToggleMobile.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });
    
    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Close mobile menu if open
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Disk Scheduling Simulation
    const startSimulationBtn = document.getElementById('start-simulation');
    const pauseSimulationBtn = document.getElementById('pause-simulation');
    const resumeSimulationBtn = document.getElementById('resume-simulation');
    const resetSimulationBtn = document.getElementById('reset-simulation');
    const downloadReportBtn = document.getElementById('download-report');
    const diskCanvas = document.getElementById('disk-visualization');
    const diskControls = document.getElementById('disk-controls');
    const totalSeekTimeEl = document.getElementById('total-seek-time');
    const requestSequenceEl = document.getElementById('request-sequence');
    const resultsTable = document.getElementById('results-table');
    
    // Set canvas dimensions
    function setupCanvas() {
        const container = diskCanvas.parentElement;
        diskCanvas.width = container.clientWidth;
        diskCanvas.height = container.clientHeight;
    }
    
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    
    // Animation variables
    let animationId = null;
    let isPaused = false;
    let currentStep = 0;
    let seekSequence = [];
    let totalSeekTime = 0;
    let currentPosition = 0;
    let initialPosition = 0;
    let maxCylinders = 0;
    let animationStartTime = 0;
    let animationProgress = 0;
    let animationDuration = 2000; // ms per movement
    
    // Disk scheduling algorithms
    function FCFS(requests, initialHead, cylinders) {
        const sequence = [...requests];
        let totalSeek = 0;
        let current = initialHead;
        const seekOperations = [];
        
        for (const request of sequence) {
            const seek = Math.abs(request - current);
            seekOperations.push({
                from: current,
                to: request,
                seek
            });
            totalSeek += seek;
            current = request;
        }
        
        return {
            sequence,
            totalSeek,
            seekOperations
        };
    }
    
    function SSTF(requests, initialHead, cylinders) {
        const sequence = [];
        let remainingRequests = [...requests];
        let current = initialHead;
        let totalSeek = 0;
        const seekOperations = [];
        
        while (remainingRequests.length > 0) {
            // Find the request with the shortest seek time
            let minSeek = Infinity;
            let nextRequest = null;
            let nextIndex = -1;
            
            for (let i = 0; i < remainingRequests.length; i++) {
                const seek = Math.abs(remainingRequests[i] - current);
                if (seek < minSeek) {
                    minSeek = seek;
                    nextRequest = remainingRequests[i];
                    nextIndex = i;
                }
            }
            
            if (nextRequest !== null) {
                sequence.push(nextRequest);
                seekOperations.push({
                    from: current,
                    to: nextRequest,
                    seek: minSeek
                });
                totalSeek += minSeek;
                current = nextRequest;
                remainingRequests.splice(nextIndex, 1);
            }
        }
        
        return {
            sequence,
            totalSeek,
            seekOperations
        };
    }
    
    function SCAN(requests, initialHead, cylinders, direction = 'right') {
        const sequence = [];
        let totalSeek = 0;
        let current = initialHead;
        const seekOperations = [];
        
        // Sort requests
        const sortedRequests = [...requests].sort((a, b) => a - b);
        
        if (direction === 'right') {
            // Requests to the right of initial head
            const rightRequests = sortedRequests.filter(req => req >= current);
            
            // Requests to the left (will be processed when moving left)
            const leftRequests = sortedRequests.filter(req => req < current).reverse();
            
            // Add right requests
            for (const req of rightRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
            
            // Go to end if needed
            if (current !== cylinders - 1) {
                const seek = Math.abs((cylinders - 1) - current);
                sequence.push(cylinders - 1);
                seekOperations.push({
                    from: current,
                    to: cylinders - 1,
                    seek
                });
                totalSeek += seek;
                current = cylinders - 1;
            }
            
            // Now move left
            for (const req of leftRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
        } else {
            // Left direction first
            const leftRequests = sortedRequests.filter(req => req <= current).reverse();
            const rightRequests = sortedRequests.filter(req => req > current);
            
            // Add left requests
            for (const req of leftRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
            
            // Go to start if needed
            if (current !== 0) {
                const seek = Math.abs(0 - current);
                sequence.push(0);
                seekOperations.push({
                    from: current,
                    to: 0,
                    seek
                });
                totalSeek += seek;
                current = 0;
            }
            
            // Now move right
            for (const req of rightRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
        }
        
        return {
            sequence,
            totalSeek,
            seekOperations
        };
    }
    
    function CSCAN(requests, initialHead, cylinders, direction = 'right') {
        const sequence = [];
        let totalSeek = 0;
        let current = initialHead;
        const seekOperations = [];
        
        // Sort requests
        const sortedRequests = [...requests].sort((a, b) => a - b);
        
        if (direction === 'right') {
            // Requests to the right of initial head
            const rightRequests = sortedRequests.filter(req => req >= current);
            
            // Requests to the left (will be processed after jumping to start)
            const leftRequests = sortedRequests.filter(req => req < current);
            
            // Add right requests
            for (const req of rightRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
            
            // Go to end if needed
            if (current !== cylinders - 1) {
                const seek = Math.abs((cylinders - 1) - current);
                sequence.push(cylinders - 1);
                seekOperations.push({
                    from: current,
                    to: cylinders - 1,
                    seek
                });
                totalSeek += seek;
                current = cylinders - 1;
            }
            
            // Jump to start
            if (leftRequests.length > 0) {
                const seek = Math.abs(0 - current);
                sequence.push(0);
                seekOperations.push({
                    from: current,
                    to: 0,
                    seek: seek
                });
                totalSeek += seek;
                current = 0;
            }
            
            // Now process left requests
            for (const req of leftRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
        } else {
            // Left direction first
            const leftRequests = sortedRequests.filter(req => req <= current).reverse();
            const rightRequests = sortedRequests.filter(req => req > current).reverse();
            
            // Add left requests
            for (const req of leftRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
            
            // Go to start if needed
            if (current !== 0) {
                const seek = Math.abs(0 - current);
                sequence.push(0);
                seekOperations.push({
                    from: current,
                    to: 0,
                    seek
                });
                totalSeek += seek;
                current = 0;
            }
            
            // Jump to end
            if (rightRequests.length > 0) {
                const seek = Math.abs((cylinders - 1) - current);
                sequence.push(cylinders - 1);
                seekOperations.push({
                    from: current,
                    to: cylinders - 1,
                    seek: seek
                });
                totalSeek += seek;
                current = cylinders - 1;
            }
            
            // Now process right requests in reverse
            for (const req of rightRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
        }
        
        return {
            sequence,
            totalSeek,
            seekOperations
        };
    }
    
    function LOOK(requests, initialHead, cylinders, direction = 'right') {
        const sequence = [];
        let totalSeek = 0;
        let current = initialHead;
        const seekOperations = [];
        
        // Sort requests
        const sortedRequests = [...requests].sort((a, b) => a - b);
        
        if (direction === 'right') {
            // Requests to the right of initial head
            const rightRequests = sortedRequests.filter(req => req >= current);
            
            // Requests to the left (will be processed when moving left)
            const leftRequests = sortedRequests.filter(req => req < current).reverse();
            
            // Add right requests
            for (const req of rightRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
            
            // Now move left (no need to go to end)
            for (const req of leftRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
        } else {
            // Left direction first
            const leftRequests = sortedRequests.filter(req => req <= current).reverse();
            const rightRequests = sortedRequests.filter(req => req > current);
            
            // Add left requests
            for (const req of leftRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
            
            // Now move right (no need to go to start)
            for (const req of rightRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
        }
        
        return {
            sequence,
            totalSeek,
            seekOperations
        };
    }
    
    function CLOOK(requests, initialHead, cylinders, direction = 'right') {
        const sequence = [];
        let totalSeek = 0;
        let current = initialHead;
        const seekOperations = [];
        
        // Sort requests
        const sortedRequests = [...requests].sort((a, b) => a - b);
        
        if (direction === 'right') {
            // Requests to the right of initial head
            const rightRequests = sortedRequests.filter(req => req >= current);
            
            // Requests to the left (will be processed after jumping to first left request)
            const leftRequests = sortedRequests.filter(req => req < current);
            
            // Add right requests
            for (const req of rightRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
            
            // Jump to first left request if any
            if (leftRequests.length > 0) {
                const firstLeft = leftRequests[0];
                const seek = Math.abs(firstLeft - current);
                sequence.push(firstLeft);
                seekOperations.push({
                    from: current,
                    to: firstLeft,
                    seek: seek
                });
                totalSeek += seek;
                current = firstLeft;
            }
            
            // Now process remaining left requests
            for (let i = 1; i < leftRequests.length; i++) {
                const req = leftRequests[i];
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
        } else {
            // Left direction first
            const leftRequests = sortedRequests.filter(req => req <= current).reverse();
            const rightRequests = sortedRequests.filter(req => req > current).reverse();
            
            // Add left requests
            for (const req of leftRequests) {
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
            
            // Jump to first right request if any
            if (rightRequests.length > 0) {
                const firstRight = rightRequests[0];
                const seek = Math.abs(firstRight - current);
                sequence.push(firstRight);
                seekOperations.push({
                    from: current,
                    to: firstRight,
                    seek: seek
                });
                totalSeek += seek;
                current = firstRight;
            }
            
            // Now process remaining right requests
            for (let i = 1; i < rightRequests.length; i++) {
                const req = rightRequests[i];
                const seek = Math.abs(req - current);
                sequence.push(req);
                seekOperations.push({
                    from: current,
                    to: req,
                    seek
                });
                totalSeek += seek;
                current = req;
            }
        }
        
        return {
            sequence,
            totalSeek,
            seekOperations
        };
    }
    
    // Draw disk visualization
    function drawDisk(currentPos, targetPos, progress, maxCylinders, seekSequence, currentStep) {
        const ctx = diskCanvas.getContext('2d');
        const width = diskCanvas.width;
        const height = diskCanvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw disk track
        const trackHeight = 30;
        const trackY = height / 2 - trackHeight / 2;
        
        ctx.fillStyle = html.classList.contains('dark') ? '#374151' : '#E5E7EB';
        ctx.fillRect(0, trackY, width, trackHeight);
        
        // Draw track markers
        ctx.fillStyle = html.classList.contains('dark') ? '#6B7280' : '#9CA3AF';
        ctx.textAlign = 'center';
        ctx.font = '12px Arial';
        
        const markerCount = 10;
        for (let i = 0; i <= markerCount; i++) {
            const x = (width / markerCount) * i;
            const cylinder = Math.floor((maxCylinders / markerCount) * i);
            ctx.fillText(cylinder.toString(), x, trackY - 5);
            ctx.beginPath();
            ctx.moveTo(x, trackY);
            ctx.lineTo(x, trackY + trackHeight);
            ctx.strokeStyle = html.classList.contains('dark') ? '#4B5563' : '#D1D5DB';
            ctx.stroke();
        }
        
        // Draw requests
        ctx.fillStyle = '#EF4444'; // Red for requests
        for (let i = 0; i < seekSequence.length; i++) {
            const req = seekSequence[i];
            const x = (req / maxCylinders) * width;
            
            // Make current request larger
            if (i === currentStep) {
                ctx.beginPath();
                ctx.arc(x, trackY + trackHeight / 2, 8, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(x, trackY + trackHeight / 2, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw disk head
        const interpolatedPos = currentPos + (targetPos - currentPos) * progress;
        const headX = (interpolatedPos / maxCylinders) * width;
        
        // Head base
        ctx.fillStyle = '#3B82F6'; // Blue for head
        ctx.beginPath();
        ctx.arc(headX, trackY - 15, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Head arm
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(headX, trackY - 5);
        ctx.lineTo(headX, trackY + trackHeight / 2);
        ctx.stroke();
    }
    
    // Animation function
    function animate(timestamp) {
        if (!animationStartTime) {
            animationStartTime = timestamp;
        }
        
        const elapsed = timestamp - animationStartTime;
        animationProgress = Math.min(elapsed / animationDuration, 1);
        
        // Draw current state
        const currentOp = seekSequence[currentStep];
        drawDisk(
            currentOp.from, 
            currentOp.to, 
            animationProgress, 
            maxCylinders, 
            seekSequence.map(op => op.to), 
            currentStep
        );
        
        // Check if animation for this step is complete
        if (animationProgress >= 1) {
            animationStartTime = 0;
            animationProgress = 0;
            currentStep++;
            
            if (currentStep < seekSequence.length) {
                // Continue to next step
                animationId = requestAnimationFrame(animate);
            } else {
                // Simulation complete
                diskControls.style.opacity = '0';
                isPaused = false;
                pauseSimulationBtn.classList.add('hidden');
                resumeSimulationBtn.classList.add('hidden');
            }
        } else {
            // Continue current animation
            animationId = requestAnimationFrame(animate);
        }
    }
    
    // Start simulation
    startSimulationBtn.addEventListener('click', () => {
        // Get input values
        const requestQueue = document.getElementById('request-queue').value
            .split(',')
            .map(num => parseInt(num.trim()))
            .filter(num => !isNaN(num));
        
        initialPosition = parseInt(document.getElementById('initial-head').value);
        maxCylinders = parseInt(document.getElementById('cylinders').value);
        const algorithm = document.getElementById('algorithm').value;
        
        // Validate inputs
        if (isNaN(initialPosition) || isNaN(maxCylinders) || requestQueue.length === 0) {
            alert('Please enter valid inputs');
            return;
        }
        
        // Run selected algorithm
        let result;
        switch (algorithm) {
            case 'FCFS':
                result = FCFS(requestQueue, initialPosition, maxCylinders);
                break;
            case 'SSTF':
                result = SSTF(requestQueue, initialPosition, maxCylinders);
                break;
            case 'SCAN':
                result = SCAN(requestQueue, initialPosition, maxCylinders);
                break;
            case 'C-SCAN':
                result = CSCAN(requestQueue, initialPosition, maxCylinders);
                break;
            case 'LOOK':
                result = LOOK(requestQueue, initialPosition, maxCylinders);
                break;
            case 'C-LOOK':
                result = CLOOK(requestQueue, initialPosition, maxCylinders);
                break;
            default:
                result = FCFS(requestQueue, initialPosition, maxCylinders);
        }
        
        // Set simulation data
        seekSequence = result.seekOperations;
        totalSeekTime = result.totalSeek;
        currentStep = 0;
        isPaused = false;
        
        // Update UI
        totalSeekTimeEl.textContent = totalSeekTime;
        requestSequenceEl.textContent = result.sequence.join(' → ');
        
        // Update results table
        resultsTable.innerHTML = '';
        result.seekOperations.forEach((op, index) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-600' : 'bg-white dark:bg-gray-700';
            
            row.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">${index + 1}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">${op.from}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">${op.to}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">${op.seek}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${result.seekOperations.slice(0, index + 1).reduce((sum, op) => sum + op.seek, 0)}
                </td>
            `;
            
            resultsTable.appendChild(row);
        });
        
        // Show controls and start animation
        diskControls.style.opacity = '1';
        pauseSimulationBtn.classList.remove('hidden');
        resumeSimulationBtn.classList.add('hidden');
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        animationStartTime = 0;
        animationId = requestAnimationFrame(animate);
    });
    
    // Pause simulation
    pauseSimulationBtn.addEventListener('click', () => {
        isPaused = true;
        cancelAnimationFrame(animationId);
        pauseSimulationBtn.classList.add('hidden');
        resumeSimulationBtn.classList.remove('hidden');
    });
    
    // Resume simulation
    resumeSimulationBtn.addEventListener('click', () => {
        isPaused = false;
        animationStartTime = performance.now() - (animationDuration * animationProgress);
        animationId = requestAnimationFrame(animate);
        pauseSimulationBtn.classList.remove('hidden');
        resumeSimulationBtn.classList.add('hidden');
    });
    
    // Reset simulation
    resetSimulationBtn.addEventListener('click', () => {
        cancelAnimationFrame(animationId);
        diskControls.style.opacity = '0';
        isPaused = false;
        currentStep = 0;
        animationStartTime = 0;
        animationProgress = 0;
        
        // Clear canvas
        const ctx = diskCanvas.getContext('2d');
        ctx.clearRect(0, 0, diskCanvas.width, diskCanvas.height);
        
        // Reset UI
        totalSeekTimeEl.textContent = '-';
        requestSequenceEl.textContent = '-';
        resultsTable.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-4 text-center text-gray-500 dark:text-gray-400">No simulation data yet</td>
            </tr>
        `;
    });
    
    // Download report
    downloadReportBtn.addEventListener('click', () => {
        if (seekSequence.length === 0) {
            alert('No simulation data to download');
            return;
        }
        
        // Create report content
        let reportContent = `Disk Scheduling Simulation Report\n`;
        reportContent += `================================\n\n`;
        reportContent += `Algorithm: ${document.getElementById('algorithm').value}\n`;
        reportContent += `Request Queue: ${document.getElementById('request-queue').value}\n`;
        reportContent += `Initial Head Position: ${initialPosition}\n`;
        reportContent += `Total Cylinders: ${maxCylinders}\n\n`;
        reportContent += `Total Seek Time: ${totalSeekTime}\n\n`;
        reportContent += `Seek Sequence:\n`;
        
        seekSequence.forEach((op, index) => {
            reportContent += `${index + 1}. Move from ${op.from} to ${op.to} (Seek: ${op.seek})\n`;
        });
        
        // Create download link
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'disk_scheduling_report.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        
        // Here you would typically send the form data to a server
        // For this example, we'll just show an alert
        alert(`Thank you for your message, ${name}! We'll get back to you soon.`);
        
        // Reset form
        contactForm.reset();
    });
    
    // Tooltip initialization
    document.querySelectorAll('.algorithm-card').forEach(card => {
        const title = card.querySelector('.algorithm-title').textContent;
        const description = card.querySelector('.algorithm-description').textContent;
        
        card.setAttribute('data-tooltip', `${title}: ${description}`);
        card.classList.add('tooltip');
        
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltiptext';
        tooltip.textContent = `${title}: ${description}`;
        card.appendChild(tooltip);
    });
});