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
    try:
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

        # Solve the linear programming problem
        result = linprog(**kwargs)
        
        if result.success:
            # Return success and solution
            return jsonify({
                'status': True,
                'message': 'Optimization was successful!',
                'objective_value': result.fun,
                'variable_values': result.x.tolist()
            }), 200
        else:
            # Return error message if the optimization fails
            return jsonify({
                'status': False,
                'message': "Could not find a solution. The problem may be infeasible or unbounded.",
                'details': result.message
            }), 400
    except ValueError as ve:
        # Handle ValueError (e.g., incorrect input format)
        return jsonify({
            'status': False,
            'message': "Invalid input data.",
            'details': str(ve)
        }), 400
    except Exception as e:
        # Handle any unexpected errors
        return jsonify({
            'status': False,
            'message': "An unexpected error occurred.",
            'details': str(e)
        }), 500

if __name__ == '__main__':
    # change host to '0.0.0.0' to make the server publicly available
    # with value '127.0.0.1' the server is only available locally
    app.run(host='127.0.0.1', port=int(os.environ.get('PORT', 8080)))