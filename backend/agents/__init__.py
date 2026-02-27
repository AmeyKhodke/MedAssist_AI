from .extractor import OrderExtractorAgent
from .safety import SafetyCheckerAgent
from .executor import InventoryExecutorAgent
from .proactive import ProactiveRefillAgent
from .chitchat import ChitchatAgent

# Initialize Agents
extractor = OrderExtractorAgent()
safety = SafetyCheckerAgent()
executor = InventoryExecutorAgent()
proactive = ProactiveRefillAgent()
chitchat = ChitchatAgent()
