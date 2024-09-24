let numVariables = 2;

        function updateFormFields() {
            const objectiveFunction = document.getElementById('objectiveFunction');
            const constraints = document.getElementById('constraints');

            objectiveFunction.innerHTML = '';
            for (let i = 0; i < numVariables; i++) {
                objectiveFunction.innerHTML += `
                    <input type="number" step="any" required>x<sub>${i+1}</sub>
                    ${i < numVariables - 1 ? '+' : ''}
                `;
            }

            constraints.innerHTML = '';
            addConstraint();
        }

        function addConstraint() {
            const constraints = document.getElementById('constraints');
            const newConstraint = document.createElement('div');
            newConstraint.className = 'equation';
            let constraintHtml = '';
            for (let i = 0; i < numVariables; i++) {
                constraintHtml += `
                    <input type="number" step="any" required>x<sub>${i+1}</sub>
                    ${i < numVariables - 1 ? '+' : ''}
                `;
            }
            constraintHtml += `
                <select>
                    <option value="<=">≤</option>
                    <option value="=">

=</option>
                    <option value=">=">≥</option>
                </select>
                <input type="number" step="any" required>
            `;
            newConstraint.innerHTML = constraintHtml;
            constraints.appendChild(newConstraint);
        }

        document.getElementById('updateVariables').addEventListener('click', function() {
            numVariables = parseInt(document.getElementById('numVariables').value);
            updateFormFields();
        });

        document.getElementById('addConstraint').addEventListener('click', addConstraint);

        document.getElementById('lpForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const objective = Array.from(document.getElementById('objectiveFunction').getElementsByTagName('input')).map(input => parseFloat(input.value));
            const objectiveType = document.getElementById('objectiveType').value;
            const constraints = Array.from(document.getElementById('constraints').getElementsByClassName('equation')).map(eq => {
                const inputs = eq.getElementsByTagName('input');
                const coefficients = Array.from(inputs).slice(0, -1).map(input => parseFloat(input.value));
                const relation = eq.getElementsByTagName('select')[0].value;
                const rhs = parseFloat(inputs[inputs.length - 1].value);
                return { coefficients, relation, rhs };
            });

            // Prepare data for the backend
            const data = {
                objective: objectiveType === 'min' ? objective : objective.map(x => -x), // Negate for maximization
                lhs_ineq: constraints.filter(c => c.relation !== '=').map(c => c.relation === '>=' ? c.coefficients.map(x => -x) : c.coefficients),
                rhs_ineq: constraints.filter(c => c.relation !== '=').map(c => c.relation === '>=' ? -c.rhs : c.rhs)
            };

            // Only include equality constraints if they exist
            const equalityConstraints = constraints.filter(c => c.relation === '=');
            if (equalityConstraints.length > 0) {
                data.lhs_eq = equalityConstraints.map(c => c.coefficients); 
                data.rhs_eq = equalityConstraints.map(c => c.rhs);
            }

            // Send data to the backend
            // using 'http://127.0.0.1:5000/solve' when working in local machine
            fetch('/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                // Display the result of the optimization
                if (result.status) {
                    let output = `${result.message}\n`;
                    output += `Objective value: ${objectiveType === 'min' ? result.objective_value : -result.objective_value}\n`;
                    output += `Variable values:\n`;
                    result.variable_values.forEach((value, index) => {
                        output += `x${index + 1} = ${value.toFixed(4)}\n`;
                    });
                    document.getElementById('result').innerHTML = `<pre>${output}</pre>`;
                } else {
                    document.getElementById('result').innerHTML = `<p>Error: ${result.message}</p><p>Details: ${result.details}</p>`;
                }
            })
            .catch(error => {
                // In case of an error from the backend display the error message
                console.error('Error:', error);
                document.getElementById('result').innerHTML = `<p>Error: ${error.message}</p>`;
            });
        });

        updateFormFields();