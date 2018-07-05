import logging
import re

from inference_node import InferenceNode

__all__ = ['build_tree']

example = \
    "Refutation found.\n" \
    "270. $false [trivial inequality removal 269]\n" \
    "269. mult(sk0,sk1) != mult (sk0,sk1) [superposition 14,125]\n" \
    "125. mult(X2,X3) = mult(X3,X2) [superposition 21,90]\n" \
    "90. mult(X4,mult(X3,X4)) = X3 [forward demodulation 75,27]\n" \
    "75. mult(inverse(X3),e) = mult(X4,mult(X3,X4)) [superposition 22,19]\n" \
    "27. mult(inverse(X2),e) = X2 [superposition 21,11]\n" \
    "22. mult(inverse(X4),mult(X4,X5)) = X5 [forward demodulation 17,10]\n" \
    "21. mult(X0,mult(X0,X1)) = X1 [forward demodulation 15,10]\n" \
    "19. e = mult(X0,mult(X1,mult(X0,X1))) [superposition 12,13]\n" \
    "17. mult(e,X5) = mult(inverse(X4),mult(X4,X5)) [superposition 12,11]\n" \
    "15. mult(e,X1) = mult(X0,mult(X0,X1)) [superposition 12,13]\n" \
    "14. mult(sK0,sK1) != mult(sK1,sK0) [cnf transformation 9]\n" \
    "13. e = mult(X0,X0) [cnf transformation 4]\n" \
    "12. mult(X0,mult(X1,X2)) = mult(mult(X0,X1),X2) [cnf transformation " \
    "3]\n" \
    "11. e = mult(inverse(X0),X0) [cnf transformation 2]\n" \
    "10. mult(e,X0) = X0 [cnf transformation 1]\n" \
    "9. mult(sK0,sK1) != mult(sK1,sK0) [skolemisation 7,8]\n" \
    "8. ?[X0,X1]: mult(X0,X1) != mult(X1,X0) <=> mult(sK0,sK1) != mult(sK1," \
    "sK0) [choice axiom]\n" \
    "7. ?[X0,X1]: mult(X0,X1) != mult(X1,X0) [ennf transformation 6]\n" \
    "6. ˜![X0,X1]: mult(X0,X1) = mult(X1,X0) [negated conjecture 5]\n" \
    "5. ![X0,X1]: mult(X0,X1) = mult(X1,X0) [input]\n" \
    "4. ![X0]: e = mult(X0,X0)[input]\n" \
    "3. ![X0,X1,X2]: mult(X0,mult(X1,X2)) = mult(mult(X0,X1),X2) [input]\n" \
    "2. ![X0]: e = mult(inverse(X0),X0) [input]\n" \
    "1. ![X0]: mult(e,X0) = X0 [input]"

PATTERN = re.compile('^([\d]+)\. (.*) ?\[(\D*) ?([\d,]*)\]$')


def build_tree(proof):
    nodes = {}
    roots = set()

    def add_as_child(node):
        if node.inference_rule == 'input':
            roots.add(node)
        else:
            for parent in node.parents:
                nodes[parent].children.add(node.number)

    for line in reversed(proof.split('\n')):
        try:
            params = parse(line)
            inference_node = InferenceNode(*params)
            nodes[inference_node.number] = inference_node
            add_as_child(inference_node)
        except AttributeError:
            logging.error(
                "Line '{}' is invalid and cannot be parsed".format(line)
            )
            pass
    return nodes


def parse(string):
    number, clause, rule, parents = re.match(PATTERN, string).groups()
    number = int(number)
    clause = clause.rstrip()
    rule = rule.rstrip()
    parents = {int(parent) for parent in parents.split(',') if parent}
    return number, clause, rule, parents


print(build_tree(example))
