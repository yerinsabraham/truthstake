// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@thirdweb-dev/contracts/eip/interface/IERC20.sol";
import {Ownable} from "@thirdweb-dev/contracts/extension/Ownable.sol";
import {ReentrancyGuard} from "@thirdweb-dev/contracts/external-deps/openzeppelin/security/ReentrancyGuard.sol";

contract SMTruthStake is Ownable, ReentrancyGuard {
    enum MarketOutcome {
        UNRESOLVED,
        OPTION_A,  // Changed from YES to OPTION_A
        OPTION_B   // Changed from NO to OPTION_B
    }

    struct Market {
        string question;
        string optionA;           // New field for Option A
        string optionB;           // New field for Option B
        uint256 endTime;
        MarketOutcome outcome;
        uint256 totalOptionAStake; // Renamed from totalYesStake
        uint256 totalOptionBStake; // Renamed from totalNoStake
        bool resolved;
        mapping(address => uint256) optionAStakeBalance; // Renamed from yesStakeBalance
        mapping(address => uint256) optionBStakeBalance; // Renamed from noStakeBalance
        mapping(address => bool) hasClaimed;
    }

    IERC20 public usdtToken;
    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    uint256 public totalFees;
    uint256 public constant FEE_PERCENTAGE = 200; // 2% fee (200 basis points, 10000 = 100%)

    event MarketCreated(uint256 indexed marketId, string question, string optionA, string optionB, uint256 endTime);
    event Staked(uint256 indexed marketId, address indexed staker, bool isOptionA, uint256 amount); // Updated isYes to isOptionA
    event MarketResolved(uint256 indexed marketId, MarketOutcome outcome);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount, uint256 fee);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    constructor(address _usdtToken) {
        usdtToken = IERC20(_usdtToken);
        _setupOwner(msg.sender);
    }

    function _canSetOwner() internal view virtual override returns (bool) {
        return msg.sender == owner();
    }

    function createMarket(
        string memory _question,
        string memory _optionA,
        string memory _optionB,
        uint256 _duration
    ) external returns (uint256) {
        require(msg.sender == owner(), "Only owner can create markets");
        require(_duration > 0, "Duration must be positive");
        require(bytes(_question).length > 0, "Question cannot be empty");
        require(bytes(_optionA).length > 0, "Option A cannot be empty");
        require(bytes(_optionB).length > 0, "Option B cannot be empty");

        uint256 marketId = marketCount++;
        Market storage market = markets[marketId];

        market.question = _question;
        market.optionA = _optionA;
        market.optionB = _optionB;
        market.endTime = block.timestamp + _duration;
        market.outcome = MarketOutcome.UNRESOLVED;

        emit MarketCreated(marketId, _question, _optionA, _optionB, market.endTime);
        return marketId;
    }

    function stake(uint256 _marketId, bool _isOptionA, uint256 _amount) external nonReentrant {
        require(_marketId < marketCount, "Market does not exist");
        Market storage market = markets[_marketId];
        require(block.timestamp < market.endTime, "Staking period has ended");
        require(!market.resolved, "Market already resolved");
        require(_amount > 0, "Amount must be positive");

        require(usdtToken.transferFrom(msg.sender, address(this), _amount), "USDT transfer failed");

        if (_isOptionA) {
            market.optionAStakeBalance[msg.sender] += _amount;
            market.totalOptionAStake += _amount;
        } else {
            market.optionBStakeBalance[msg.sender] += _amount;
            market.totalOptionBStake += _amount;
        }

        emit Staked(_marketId, msg.sender, _isOptionA, _amount);
    }

    function resolveMarket(uint256 _marketId, MarketOutcome _outcome) external {
        require(msg.sender == owner(), "Only owner can resolve markets");
        require(_marketId < marketCount, "Market does not exist");
        Market storage market = markets[_marketId];
        require(block.timestamp >= market.endTime, "Market hasn't ended yet");
        require(!market.resolved, "Market already resolved");
        require(_outcome != MarketOutcome.UNRESOLVED, "Invalid outcome");

        market.outcome = _outcome;
        market.resolved = true;

        emit MarketResolved(_marketId, _outcome);
    }

    function claimWinnings(uint256 _marketId) external nonReentrant {
        require(_marketId < marketCount, "Market does not exist");
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved yet");
        require(!market.hasClaimed[msg.sender], "Winnings already claimed");

        uint256 userStake;
        uint256 winningStake;
        uint256 losingStake;

        if (market.outcome == MarketOutcome.OPTION_A) {
            userStake = market.optionAStakeBalance[msg.sender];
            winningStake = market.totalOptionAStake;
            losingStake = market.totalOptionBStake;
            market.optionAStakeBalance[msg.sender] = 0;
        } else if (market.outcome == MarketOutcome.OPTION_B) {
            userStake = market.optionBStakeBalance[msg.sender];
            winningStake = market.totalOptionBStake;
            losingStake = market.totalOptionAStake;
            market.optionBStakeBalance[msg.sender] = 0;
        } else {
            revert("Market outcome is not valid");
        }

        require(userStake > 0, "No winnings to claim");

        uint256 rewardRatio = (losingStake * 1e18) / winningStake;
        uint256 grossWinnings = userStake + (userStake * rewardRatio) / 1e18;
        uint256 fee = (grossWinnings * FEE_PERCENTAGE) / 10000;
        uint256 netWinnings = grossWinnings - fee;

        totalFees += fee;
        market.hasClaimed[msg.sender] = true;

        require(usdtToken.transfer(msg.sender, netWinnings), "USDT transfer failed");

        emit WinningsClaimed(_marketId, msg.sender, netWinnings, fee);
    }

    function batchClaimWinnings(uint256 _marketId, address[] calldata _users) external nonReentrant {
        require(_marketId < marketCount, "Market does not exist");
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved yet");

        for (uint256 i = 0; i < _users.length; i++) {
            address user = _users[i];
            if (market.hasClaimed[user]) continue;

            uint256 userStake;
            uint256 winningStake;
            uint256 losingStake;

            if (market.outcome == MarketOutcome.OPTION_A) {
                userStake = market.optionAStakeBalance[user];
                winningStake = market.totalOptionAStake;
                losingStake = market.totalOptionBStake;
                market.optionAStakeBalance[user] = 0;
            } else if (market.outcome == MarketOutcome.OPTION_B) {
                userStake = market.optionBStakeBalance[user];
                winningStake = market.totalOptionBStake;
                losingStake = market.totalOptionAStake;
                market.optionBStakeBalance[user] = 0;
            } else {
                revert("Market outcome is not valid");
            }

            if (userStake == 0) continue;

            uint256 rewardRatio = (losingStake * 1e18) / winningStake;
            uint256 grossWinnings = userStake + (userStake * rewardRatio) / 1e18;
            uint256 fee = (grossWinnings * FEE_PERCENTAGE) / 10000;
            uint256 netWinnings = grossWinnings - fee;

            totalFees += fee;
            market.hasClaimed[user] = true;

            require(usdtToken.transfer(user, netWinnings), "USDT transfer failed");

            emit WinningsClaimed(_marketId, user, netWinnings, fee);
        }
    }

    function withdrawFees() external {
        require(msg.sender == owner(), "Only owner can withdraw fees");
        uint256 amount = totalFees;
        require(amount > 0, "No fees to withdraw");

        totalFees = 0;
        require(usdtToken.transfer(msg.sender, amount), "Fee withdrawal failed");

        emit FeesWithdrawn(msg.sender, amount);
    }

    function getMarketInfo(uint256 _marketId)
        external
        view
        returns (
            string memory question,
            string memory optionA,
            string memory optionB,
            uint256 endTime,
            MarketOutcome outcome,
            uint256 totalOptionAStake,
            uint256 totalOptionBStake,
            bool resolved
        )
    {
        require(_marketId < marketCount, "Market does not exist");
        Market storage market = markets[_marketId];
        return (
            market.question,
            market.optionA,
            market.optionB,
            market.endTime,
            market.outcome,
            market.totalOptionAStake,
            market.totalOptionBStake,
            market.resolved
        );
    }

    function getStakeBalance(uint256 _marketId, address _user)
        external
        view
        returns (uint256 optionAStake, uint256 optionBStake)
    {
        require(_marketId < marketCount, "Market does not exist");
        Market storage market = markets[_marketId];
        return (market.optionAStakeBalance[_user], market.optionBStakeBalance[_user]);
    }
}