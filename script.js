function calculateChange() {
    const purchaseAmount = parseFloat(document.getElementById('purchaseAmount').value);
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    const changeTotalElement = document.getElementById('changeTotal');
    const changeBreakdownElement = document.getElementById('changeBreakdown');

    // Limpiar resultados anteriores
    changeTotalElement.innerHTML = '';
    changeBreakdownElement.innerHTML = '';

    if (isNaN(purchaseAmount) || isNaN(paymentAmount)) {
        changeTotalElement.textContent = 'Por favor ingrese montos válidos';
        changeTotalElement.classList.add('error');
        return;
    }

    const changeAmount = paymentAmount - purchaseAmount;
    
    if (changeAmount < 0) {
        changeTotalElement.textContent = 'El pago es insuficiente';
        changeTotalElement.classList.add('error');
        return;
    }

    const denominations = [
        { value: 20, id: 'bill20', name: 'Billetes de $20' },
        { value: 10, id: 'bill10', name: 'Billetes de $10' },
        { value: 5, id: 'bill5', name: 'Billetes de $5' },
        { value: 1, id: 'coin1', name: 'Monedas de $1' },
        { value: 0.50, id: 'coin50', name: 'Monedas de 50¢' },
        { value: 0.25, id: 'coin25', name: 'Monedas de 25¢' },
        { value: 0.10, id: 'coin10', name: 'Monedas de 10¢' },
        { value: 0.05, id: 'coin5', name: 'Monedas de 5¢' },
        { value: 0.01, id: 'coin1cent', name: 'Monedas de 1¢' }
    ];

    let remainingChange = changeAmount;
    let changeBreakdown = [];

    denominations.forEach(denom => {
        const availableCount = parseInt(document.getElementById(denom.id).value);
        const maxCount = Math.floor(remainingChange / denom.value);
        const usedCount = Math.min(maxCount, availableCount);

        if (usedCount > 0) {
            changeBreakdown.push({
                name: denom.name,
                count: usedCount
            });
            remainingChange = parseFloat((remainingChange - (usedCount * denom.value)).toFixed(2));
            
            // Actualizar cantidad de billetes/monedas
            const newCount = availableCount - usedCount;
            document.getElementById(denom.id).value = newCount;
        }
    });

    // Ajustar la condición para manejar imprecisiones decimales
    if (remainingChange > 0.009) { // Tolerancia para imprecisiones
        changeTotalElement.textContent = 'No hay suficiente cambio disponible';
        changeTotalElement.classList.add('error');
        return;
    }

    // Mostrar cambio total
    changeTotalElement.innerHTML = `Cambio Total: <span style="color: blue;">$${changeAmount.toFixed(2)}</span>`;
    changeTotalElement.classList.remove('error');

    // Mostrar desglose del cambio
    changeBreakdown.forEach(item => {
        const changeItem = document.createElement('div');
        changeItem.classList.add('change-item');
        changeItem.innerHTML = `
            <span>${item.name}</span>
            <span>${item.count}</span>
        `;
        changeBreakdownElement.appendChild(changeItem);
    });

    // Registrar transacción
    logTransaction(`Compra: $${purchaseAmount.toFixed(2)}, Pago: $${paymentAmount.toFixed(2)}, Cambio: $${changeAmount.toFixed(2)}`);

    // Guardar estado actualizado
    saveState();
}
