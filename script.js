// State Management for Charts
let breakEvenChartInstance = null;
let profitChartInstance = null;

// Initialize Event Listeners on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
	const calculateBtn = document.getElementById('calculateBtn');
	const resetBtn = document.getElementById('resetBtn');
	const loadDemoBtn = document.getElementById('loadDemoBtn');

	calculateBtn.addEventListener('click', performCalculation);
	resetBtn.addEventListener('click', resetCalculator);
	loadDemoBtn.addEventListener('click', loadSampleDemo);

	// Initial calculation with default values
	loadSampleDemo();
});

// Format numbers into Indian Rupee Currency Format (₹)
function formatCurrency(num) {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 2
	}).format(num);
}

// Input Validation Function
function validateInputs(fc, vc, sp, qty) {
	const errorElement = document.getElementById('errorMessage');
	errorElement.classList.add('hidden');
	errorElement.innerHTML = '';

	let errors = [];

	if (isNaN(fc) || fc < 0) errors.push("Fixed Cost must be a valid positive number.");
	if (isNaN(vc) || vc < 0) errors.push("Variable Cost per unit must be a non-negative number.");
	if (isNaN(sp) || sp <= 0) errors.push("Selling Price per unit must be greater than zero.");
	if (isNaN(qty) || qty < 0) errors.push("Expected Production Quantity must be zero or more.");

	if (sp <= vc) {
		errors.push("Selling Price per unit (₹" + sp + ") must be greater than Variable Cost per unit (₹" + vc + "). Otherwise, unit contribution remains zero or negative.");
	}

	if (errors.length > 0) {
		errorElement.innerHTML = errors.join("<br>");
		errorElement.classList.remove('hidden');
		return false;
	}

	return true;
}

// Main Calculation Handler
function performCalculation() {
	// Fetch input values
	const fc = parseFloat(document.getElementById('fixedCost').value);
	const vc = parseFloat(document.getElementById('variableCost').value);
	const sp = parseFloat(document.getElementById('sellingPrice').value);
	const qty = parseFloat(document.getElementById('expectedSales').value);

	// Validate inputs
	if (!validateInputs(fc, vc, sp, qty)) return;

	// Formulas
	const contributionPerUnit = sp - vc;
	const breakEvenUnits = Math.ceil(fc / contributionPerUnit);
	const breakEvenSalesValue = breakEvenUnits * sp;
	const totalRevenue = sp * qty;
	const totalCost = fc + (vc * qty);
	const netProfitLoss = totalRevenue - totalCost;

	// Update Dashboard Cards
	document.getElementById('resBEPUnits').innerText = breakEvenUnits.toLocaleString('en-IN') + ' units';
	document.getElementById('resBEPSales').innerText = formatCurrency(breakEvenSalesValue);
	document.getElementById('resContribution').innerText = formatCurrency(contributionPerUnit);
	document.getElementById('resTotalRevenue').innerText = formatCurrency(totalRevenue);
	document.getElementById('resTotalCost').innerText = formatCurrency(totalCost);
	document.getElementById('resProfitLoss').innerText = formatCurrency(Math.abs(netProfitLoss));

	// Update Profit / Loss Status Card Styling
	const badge = document.getElementById('resStatusBadge');

	if (netProfitLoss > 0) {
		badge.innerText = 'Profitable';
		badge.className = 'status-badge bg-profit';
		document.getElementById('resProfitLoss').innerText = '+' + formatCurrency(netProfitLoss);
	} else if (netProfitLoss < 0) {
		badge.innerText = 'Operating Loss';
		badge.className = 'status-badge bg-loss';
		document.getElementById('resProfitLoss').innerText = '-' + formatCurrency(Math.abs(netProfitLoss));
	} else {
		badge.innerText = 'Break-Even Point';
		badge.className = 'status-badge bg-breakeven';
		document.getElementById('resProfitLoss').innerText = formatCurrency(0);
	}

	// Render Graphs & Diagnostics
	renderCharts(fc, vc, sp, qty, breakEvenUnits);
	renderBusinessAnalysis(netProfitLoss, breakEvenUnits, qty, contributionPerUnit);
}

// Load Prescribed Sample Demonstration Data
function loadSampleDemo() {
	document.getElementById('productName').value = "Sample Manufacturing Enterprise";
	document.getElementById('fixedCost').value = 80000;
	document.getElementById('variableCost').value = 120;
	document.getElementById('sellingPrice').value = 320;
	document.getElementById('expectedSales').value = 600;

	performCalculation();
}

// Reset Form & Clear UI
function resetCalculator() {
	document.getElementById('calculatorForm').reset();
	document.getElementById('errorMessage').classList.add('hidden');
    
	document.getElementById('resBEPUnits').innerText = '0 units';
	document.getElementById('resBEPSales').innerText = '₹0';
	document.getElementById('resContribution').innerText = '₹0';
	document.getElementById('resTotalRevenue').innerText = '₹0';
	document.getElementById('resTotalCost').innerText = '₹0';
	document.getElementById('resProfitLoss').innerText = '₹0';
    
	const badge = document.getElementById('resStatusBadge');
	badge.innerText = 'Awaiting Input';
	badge.className = 'status-badge';

	document.getElementById('analysisContent').innerHTML = '<p class="placeholder-text">Run a simulation above to generate performance insights and profitability advice.</p>';

	if (breakEvenChartInstance) breakEvenChartInstance.destroy();
	if (profitChartInstance) profitChartInstance.destroy();
}

// Render Graphs with Chart.js
function renderCharts(fc, vc, sp, qty, bepUnits) {
	const maxQty = Math.max(qty * 1.5, bepUnits * 1.5, 100);
	const step = Math.ceil(maxQty / 10);
    
	const labels = [];
	const totalCostData = [];
	const revenueData = [];
	const profitData = [];

	for (let currentQty = 0; currentQty <= maxQty; currentQty += step) {
		labels.push(currentQty);
		const rev = currentQty * sp;
		const cost = fc + (vc * currentQty);
		revenueData.push(rev);
		totalCostData.push(cost);
		profitData.push(rev - cost);
	}

	// Canvas contexts
	const ctxBEP = document.getElementById('breakEvenChart').getContext('2d');
	const ctxProfit = document.getElementById('profitChart').getContext('2d');

	// Destroy existing chart instances if re-calculating
	if (breakEvenChartInstance) breakEvenChartInstance.destroy();
	if (profitChartInstance) profitChartInstance.destroy();

	// 1. Cost vs Revenue Graph
	breakEvenChartInstance = new Chart(ctxBEP, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [
				{
					label: 'Total Revenue (₹)',
					data: revenueData,
					borderColor: '#2563eb',
					backgroundColor: 'rgba(37, 99, 235, 0.1)',
					fill: false,
					tension: 0.1
				},
				{
					label: 'Total Cost (₹)',
					data: totalCostData,
					borderColor: '#ef4444',
					backgroundColor: 'rgba(239, 68, 68, 0.1)',
					fill: false,
					tension: 0.1
				},
				{
					label: 'Fixed Cost (₹)',
					data: labels.map(() => fc),
					borderColor: '#94a3b8',
					borderDash: [5, 5],
					fill: false,
					pointRadius: 0
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: { title: { display: true, text: 'Production / Sales Quantity (Units)' } },
				y: { title: { display: true, text: 'Amount (₹)' } }
			}
		}
	});

	// 2. Profit / Loss Graph
	profitChartInstance = new Chart(ctxProfit, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [{
				label: 'Net Profit / Loss (₹)',
				data: profitData,
				borderColor: profitData.map(val => val >= 0 ? '#10b981' : '#ef4444'),
				backgroundColor: 'rgba(16, 185, 129, 0.1)',
				fill: true,
				tension: 0.1
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: { title: { display: true, text: 'Production / Sales Quantity (Units)' } },
				y: { title: { display: true, text: 'Profit / Loss (₹)' } }
			}
		}
	});
}

// Business Analysis Diagnostics & Actionable Advice
function renderBusinessAnalysis(netProfitLoss, bepUnits, qty, contribution) {
	const container = document.getElementById('analysisContent');
	const marginOfSafety = qty - bepUnits;

	let alertClass = '';
	let title = '';
	let description = '';

	if (netProfitLoss > 0) {
		alertClass = 'diagnostic-profit';
		title = 'Profitable Operation';
		description = `The business operates above the break-even threshold. Sales exceed the break-even point by <strong>${marginOfSafety.toLocaleString('en-IN')} units</strong>.`;
	} else if (netProfitLoss < 0) {
		alertClass = 'diagnostic-loss';
		title = 'Operating Loss Warning';
		description = `Current production volume is below the break-even requirement. You need to sell <strong>${Math.abs(marginOfSafety).toLocaleString('en-IN')} additional units</strong> to avoid financial losses.`;
	} else {
		alertClass = 'diagnostic-breakeven';
		title = 'Exact Break-Even';
		description = `Total revenue exactly equals total costs. The business is incurring zero profit and zero loss.`;
	}

	container.innerHTML = `
		<div class="diagnostic-alert ${alertClass}">
			<h3>${title}</h3>
			<p>${description}</p>
		</div>
		<h4>Strategic Recommendations to Enhance Profitability:</h4>
		<ul class="suggestions-list">
			<li><strong>Minimum Target Volume:</strong> Produce and sell at least <strong>${bepUnits.toLocaleString('en-IN')} units</strong> to cover all fixed and variable overheads.</li>
			<li><strong>Contribution Optimization:</strong> Current unit contribution margin is <strong>${formatCurrency(contribution)}</strong>. Increasing selling price or reducing raw material/variable costs will lower the break-even volume requirement.</li>
			<li><strong>Fixed Overhead Efficiency:</strong> Negotiate plant rent, machinery leasing, or utility overheads to lower the overall fixed cost base.</li>
		</ul>
	`;
}
