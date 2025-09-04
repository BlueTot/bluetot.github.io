from qiskit_aer import Aer
from qiskit.circuit import QuantumCircuit
from qiskit.compiler import transpile
from qiskit.circuit.library import MCXGate
from math import floor, pi, sqrt
import numpy as np
import json


def apply_oracle(qc: QuantumCircuit, n: int, anti_controls: list[int], aux: int) -> None:
    """
        Applies an oracle that marks a value given by the controls and anti controls
        anti controls: subset of the controlled qubits that are inverted.
    """

    controls = list(range(n-1))

    # apply X to qubits that need to be anticontrols
    for q in anti_controls:
        qc.x(q)

    # surrounding MCX's target with H turns into a MCZ
    qc.h(aux)
    qc.append(MCXGate(len(controls)), [*controls, aux])
    qc.h(aux)

    # uncompute
    for q in anti_controls:
        qc.x(q)


def diffuse(qc: QuantumCircuit, n: int, aux: int) -> None:
    """
        Function to apply a grover diffusion operator
    """

    # apply H then X to every qubit
    for i in range(n):
        qc.h(i)
        qc.x(i)
    
    controls = list(range(n-1))

    # apply MCZ with aux as the target
    qc.h(aux)
    qc.append(MCXGate(len(controls)), [*controls, aux])
    qc.h(aux)

    # apply X then H to every qubit
    for i in range(n):
        qc.x(i)
        qc.h(i)


def to_probability(prob_amp: complex) -> float:
    """
        Function that gets the probability from a probability amplitude
    """
    modulus = prob_amp * complex.conjugate(prob_amp)
    return modulus.real


def get_anti_controls(char: str) -> list[int]:
    """
        Get the anti controls for a given character
    """
    curr = ord(char)
    i = 0
    result = []
    while curr > 0:
        curr, mod = divmod(curr, 2)
        if not mod:
            result.append(i)
        i += 1
    return result


def get_probs(qc: QuantumCircuit, n: int) -> list[float]:
    """
        Get the probability state vector by running the quantum circuit
    """
    
    # run using simulator
    sim = Aer.get_backend("statevector_simulator")
    tqc = transpile(qc, sim)
    result = sim.run(tqc).result()
    statevector = np.asarray(result.get_statevector(qc))

    # convert to probabilities
    probs: list[float] = [0 for _ in range(1 << (n-1))]
    for i, z in enumerate(statevector):
        probs[i & ((1 << (n-1)) - 1)] += to_probability(z)
    return probs


def get_largest(probs: list[float]) -> tuple[float, int]:
    """
        Function to get pair of largest probability and value from the probability statevector
    """
    return max([(p, i) for i, p in enumerate(probs)])


def main() -> None:
    """
        Main function, writes the highest probability over each iteration to a json
    """

    n = 8
    qc = QuantumCircuit(n)
    aux = n - 1
    char = 'A' # this character can be anything
    anti_controls = get_anti_controls(char)
    num_repeats = floor(pi / 4 * sqrt(2 ** n))

    # initial step
    for i in range(n):
        qc.h(i)

    result = []
    result.append(get_largest(get_probs(qc, n))[0])

    for _ in range(num_repeats):

        apply_oracle(qc, n, anti_controls, aux)
        diffuse(qc, n, aux)

        probs = get_probs(qc, n)
        largest = get_largest(probs)[0]
        result.append(largest)

    print(len(result), result)
    with open("assets/probs.json", "w") as f:
        f.write(json.dumps(result, indent=4))

if __name__ in "__main__":
    main()
