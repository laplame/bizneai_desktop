// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GenesisToken is ERC777, Ownable {
    uint256 public constant TOTAL_SUPPLY = 110000 * 10 ** 18;
    uint256 public constant BRAND_ALLOCATION = 30000 * 10 ** 18;
    uint256 public constant INFLUENCER_ALLOCATION = 30000 * 10 ** 18;
    uint256 public constant LINK4DEAL_ALLOCATION = 30000 * 10 ** 18;
    uint256 public constant BLOCK_REWARD = 10000 * 10 ** 18;
    uint256 public constant COUPON_REWARD = 5 * 10 ** 18;

    address public brand;
    address public influencer;
    address public link4deal;

    mapping(address => uint256) public couponUsage;

    event CouponUsed(address indexed user, uint256 reward);

    constructor(
        address _brand,
        address _influencer,
        address _link4deal,
        address[] memory defaultOperators
    ) ERC777("GenesisToken", "GTKN", defaultOperators) {
        require(_brand != address(0), "Brand address cannot be zero");
        require(_influencer != address(0), "Influencer address cannot be zero");
        require(_link4deal != address(0), "Link4deal address cannot be zero");

        brand = _brand;
        influencer = _influencer;
        link4deal = _link4deal;

        _mint(_brand, BRAND_ALLOCATION, "", "");
        _mint(_influencer, INFLUENCER_ALLOCATION, "", "");
        _mint(_link4deal, LINK4DEAL_ALLOCATION, "", "");
    }

    function rewardBlockGenerator(address generator) external onlyOwner {
        require(generator != address(0), "Generator address cannot be zero");
        _mint(generator, BLOCK_REWARD, "", "");
    }

    function useCoupon(address user) external onlyOwner {
        require(user != address(0), "User address cannot be zero");
        _mint(user, COUPON_REWARD, "", "");
        couponUsage[user] += 1;
        emit CouponUsed(user, COUPON_REWARD);
    }

    function updateAddresses(
        address _brand,
        address _influencer,
        address _link4deal
    ) external onlyOwner {
        if (_brand != address(0)) {
            brand = _brand;
        }
        if (_influencer != address(0)) {
            influencer = _influencer;
        }
        if (_link4deal != address(0)) {
            link4deal = _link4deal;
        }
    }
} 