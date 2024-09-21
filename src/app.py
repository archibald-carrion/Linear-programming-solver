from flask import Flask, request, jsonify, send_from_directory
from scipy.optimize import linprog
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/solve', methods=['POST'])
def solve():
    data = request.json
    c = data.get('objective')  # Coefficients of the objective function
    A = data.get('lhs_ineq')  # Coefficients of the left-hand side of the inequality constraints
    b = data.get('rhs_ineq')  # Coefficients of the right-hand side of the inequality constraints
    A_eq = data.get('lhs_eq')  # Coefficients of the left-hand side of the equality constraints
    b_eq = data.get('rhs_eq')  # Coefficients of the right-hand side of the equality constraints

    # Prepare kwargs for linprog
    kwargs = {
        'c': c,
        'A_ub': A,
        'b_ub': b,
        'method': 'highs'
    }

    # Only include equality constraints if they exist
    if A_eq and b_eq:
        kwargs['A_eq'] = A_eq
        kwargs['b_eq'] = b_eq

    try:
        # Solve the linear programming problem
        result = linprog(**kwargs)
        if result.success:
            # Return success and solution
            return jsonify({
                'status': result.success,
                'message': 'Optimization was successful!',
                'objective_value': result.fun,
                'variable_values': result.x.tolist()
            }), 200
        else:
            # Return error message if the optimization fails
            return jsonify({
                'status': result.success,
                'message': result.message
            }), 400
    except Exception as e:
        # Handle any unexpected errors
        return jsonify({
            'status': False,
            'message': f"An error occurred: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))